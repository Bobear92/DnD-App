"""shared/file_storage.py — the one place uploads are stored (deploy ticket T4).

Production stores uploads in Cloudflare R2 because Render's disk is wiped on every deploy; dev and
tests use local disk. Both backends sit behind the same save/delete API, and the key that lands in
the database (``uploads/<folder>/<ids>/<uuid><ext>``) is identical for both, so switching needs no
data migration. R2 is exercised against a fake client — no Cloudflare account needed.
"""
import asyncio
import io
from pathlib import Path

import pytest
from fastapi import HTTPException, UploadFile
from starlette.datastructures import Headers

import shared.file_storage as fs
from config import settings


def _upload(name="a.png", content_type="image/png", size=10):
    return UploadFile(file=io.BytesIO(b"x" * size), filename=name,
                      headers=Headers({"content-type": content_type}))


def _save(file, kind, *parts):
    return asyncio.run(fs.save_upload(file, kind, *parts))


class FakeS3:
    """The five boto3 S3 methods R2Storage uses, backed by a dict."""

    def __init__(self):
        self.objects = {}
        self.puts = []

    def put_object(self, Bucket, Key, Body, **extra):
        self.objects[Key] = Body
        self.puts.append({"Bucket": Bucket, "Key": Key, **extra})

    def head_object(self, Bucket, Key):
        if Key not in self.objects:
            err = Exception("Not Found")
            err.response = {"Error": {"Code": "404"}}
            raise err
        return {}

    def delete_object(self, Bucket, Key):
        self.objects.pop(Key, None)

    def list_objects_v2(self, Bucket, Prefix, ContinuationToken=None):
        keys = sorted(k for k in self.objects if k.startswith(Prefix))
        start = int(ContinuationToken or 0)
        page = keys[start:start + 2]  # tiny pages so pagination is exercised
        more = start + 2 < len(keys)
        return {"Contents": [{"Key": k} for k in page], "IsTruncated": more,
                **({"NextContinuationToken": str(start + 2)} if more else {})}

    def delete_objects(self, Bucket, Delete):
        for o in Delete["Objects"]:
            self.objects.pop(o["Key"], None)


@pytest.fixture
def local(tmp_path, monkeypatch):
    store = fs.LocalStorage(tmp_path)
    monkeypatch.setattr(fs, "get_storage", lambda: store)
    return store


@pytest.fixture
def r2(monkeypatch):
    store = fs.R2Storage(FakeS3(), "dnd-uploads")
    monkeypatch.setattr(fs, "get_storage", lambda: store)
    return store


class TestKeys:
    def test_key_shape_is_backend_independent(self, local):
        key = _save(_upload("portrait.PNG"), fs.CHARACTER_IMAGE, 7)
        assert key.startswith("uploads/characters/7/") and key.endswith(".PNG")

    def test_music_keys_keep_their_owner_path_and_lowercase_ext(self, local):
        key = _save(_upload("Theme.MP3", "audio/mpeg"), fs.MUSIC, "npcs", 3, 9)
        assert key.startswith("uploads/music/npcs/3/9/") and key.endswith(".mp3")


class TestValidation:
    def test_wrong_image_type_rejected(self, local):
        with pytest.raises(HTTPException) as e:
            _save(_upload("a.gif", "image/gif"), fs.NPC_IMAGE, 1, 2)
        assert e.value.status_code == 400 and "JPEG, PNG, and WebP" in e.value.detail

    def test_session_images_also_allow_gif(self, local):
        assert _save(_upload("a.gif", "image/gif"), fs.SESSION_IMAGE, 1, 2).endswith(".gif")

    def test_music_filters_by_extension(self, local):
        with pytest.raises(HTTPException):
            _save(_upload("a.exe", "audio/mpeg"), fs.MUSIC, "characters", 1)

    def test_size_limit_per_kind(self, local):
        with pytest.raises(HTTPException) as e:
            _save(_upload(size=10 * 1024 * 1024 + 1), fs.CHARACTER_IMAGE, 1)
        assert "10 MB" in e.value.detail
        # maps allow far more
        assert _save(_upload(size=10 * 1024 * 1024 + 1), fs.MAP_IMAGE, 1, 2)


class TestLocalStorage:
    def test_save_writes_under_root_and_delete_removes(self, local):
        key = _save(_upload(), fs.MAP_IMAGE, 1, 2)
        path = local.root / key[len("uploads/"):]
        assert path.read_bytes() == b"x" * 10
        assert fs.delete_upload(key) is True
        assert not path.exists()
        assert fs.delete_upload(key) is False  # second delete: nothing there

    def test_non_upload_values_are_ignored(self, local):
        # theme_music_url may hold a pasted link; deleting it must not touch storage.
        assert fs.delete_upload("https://youtu.be/abc") is False
        assert fs.delete_upload(None) is False

    def test_delete_folder_removes_every_file_for_that_owner(self, local):
        keep = _save(_upload(), fs.SESSION_IMAGE, 1, 3)
        for _ in range(3):
            _save(_upload(), fs.SESSION_IMAGE, 1, 2)
        fs.delete_upload_folder(fs.SESSION_IMAGE, 1, 2)
        assert not (local.root / "sessions" / "1" / "2").exists()
        assert (local.root / keep[len("uploads/"):]).exists()

    def test_key_cannot_escape_the_root(self, local):
        with pytest.raises(ValueError):
            local.delete("uploads/../../etc/passwd")


class TestDeleteByFilename:
    @pytest.mark.parametrize("bad", ["", ".", "..", "../2/x.png", "..\\2\\x.png", "a/b.png"])
    def test_anything_but_a_plain_filename_is_not_found(self, local, bad):
        _save(_upload(), fs.SESSION_IMAGE, 1, 2)
        assert fs.delete_upload_file(fs.SESSION_IMAGE, 1, 3, filename=bad) is False

    def test_plain_filename_in_the_right_folder_is_deleted(self, local):
        key = _save(_upload(), fs.SESSION_IMAGE, 1, 2)
        assert fs.delete_upload_file(fs.SESSION_IMAGE, 1, 2, filename=key.rsplit("/", 1)[1]) is True


class TestR2Storage:
    def test_save_puts_object_under_the_same_key(self, r2):
        key = _save(_upload("map.webp", "image/webp"), fs.MAP_IMAGE, 4, 5)
        assert key.startswith("uploads/maps/4/5/")
        put = r2.client.puts[0]
        assert put["Bucket"] == "dnd-uploads" and put["Key"] == key
        assert put["ContentType"] == "image/webp"
        assert "immutable" in put["CacheControl"]

    def test_delete_reports_whether_the_object_existed(self, r2):
        key = _save(_upload(), fs.NPC_IMAGE, 1, 1)
        assert fs.delete_upload(key) is True
        assert key not in r2.client.objects
        assert fs.delete_upload(key) is False

    def test_delete_folder_paginates_and_spares_other_owners(self, r2):
        for _ in range(5):
            _save(_upload(), fs.SESSION_IMAGE, 1, 2)
        keep = _save(_upload(), fs.SESSION_IMAGE, 1, 20)  # "1/2" must not match "1/20"
        fs.delete_upload_folder(fs.SESSION_IMAGE, 1, 2)
        assert list(r2.client.objects) == [keep]

    def test_unexpected_errors_are_not_swallowed(self, r2):
        def boom(**_):
            err = Exception("AccessDenied")
            err.response = {"Error": {"Code": "403"}}
            raise err
        r2.client.head_object = boom
        with pytest.raises(Exception, match="AccessDenied"):
            r2.delete("uploads/npcs/1/1/x.png")


class TestBackendSelection:
    def test_tests_run_on_local_storage_outside_backend_uploads(self):
        fs.get_storage.cache_clear()
        store = fs.get_storage()
        assert isinstance(store, fs.LocalStorage)
        assert Path(store.root).resolve() != (Path(fs.__file__).resolve().parents[1] / "uploads")

    def test_r2_without_credentials_fails_fast_naming_what_is_missing(self, monkeypatch):
        monkeypatch.setattr(settings, "storage_backend", "r2")
        monkeypatch.setattr(settings, "r2_bucket", "b")
        for name in ("r2_account_id", "r2_access_key_id", "r2_secret_access_key"):
            monkeypatch.setattr(settings, name, "")
        fs.get_storage.cache_clear()
        try:
            with pytest.raises(RuntimeError, match="R2_ACCOUNT_ID"):
                fs.get_storage()
        finally:
            fs.get_storage.cache_clear()

    def test_r2_with_credentials_builds_a_client_for_the_account_endpoint(self, monkeypatch):
        for name, value in {"storage_backend": "r2", "r2_account_id": "acct", "r2_access_key_id": "id",
                            "r2_secret_access_key": "secret", "r2_bucket": "dnd-uploads"}.items():
            monkeypatch.setattr(settings, name, value)
        fs.get_storage.cache_clear()
        try:
            store = fs.get_storage()
            assert isinstance(store, fs.R2Storage) and store.bucket == "dnd-uploads"
            assert store.client.meta.endpoint_url == "https://acct.r2.cloudflarestorage.com"
        finally:
            fs.get_storage.cache_clear()

    def test_unknown_backend_is_an_error(self, monkeypatch):
        monkeypatch.setattr(settings, "storage_backend", "s3ish")
        fs.get_storage.cache_clear()
        try:
            with pytest.raises(RuntimeError, match="Unknown STORAGE_BACKEND"):
                fs.get_storage()
        finally:
            fs.get_storage.cache_clear()
