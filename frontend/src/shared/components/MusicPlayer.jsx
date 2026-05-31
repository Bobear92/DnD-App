import { useMemo } from 'react';
import { Music, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const BACKEND_URL = 'http://localhost:8000';

const AUDIO_EXT = /\.(mp3|ogg|wav|m4a|aac|flac)(\?.*)?$/i;
const VIDEO_EXT = /\.(mp4|webm|mov)(\?.*)?$/i;

/**
 * Extract a YouTube video id from any common YouTube URL shape.
 * Returns the id string, or null if not a YouTube URL.
 */
export function parseYouTubeId(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'youtu.be') return u.pathname.slice(1) || null;
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      if (u.pathname === '/watch') return u.searchParams.get('v');
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null;
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null;
    }
  } catch {
    /* not a parseable URL */
  }
  return null;
}

/**
 * Build a Spotify embed URL from an open.spotify.com link.
 * Handles locale prefixes (e.g. /intl-fr/track/ID). Returns null if not Spotify.
 */
export function parseSpotifyEmbed(url) {
  try {
    const u = new URL(url);
    if (u.hostname.replace(/^www\./, '') !== 'open.spotify.com') return null;
    const parts = u.pathname.split('/').filter(Boolean);
    const kinds = ['track', 'playlist', 'album', 'episode', 'show', 'artist'];
    const idx = parts.findIndex((p) => kinds.includes(p));
    if (idx === -1 || !parts[idx + 1]) return null;
    return `https://open.spotify.com/embed/${parts[idx]}/${parts[idx + 1]}`;
  } catch {
    return null;
  }
}

/**
 * Classify a stored music value (a pasted URL or an uploaded `uploads/...` path)
 * into a playable source descriptor.
 */
export function detectSource(src) {
  if (!src || !src.trim()) return null;
  const value = src.trim();

  // Uploaded file persisted relative to the backend.
  if (value.startsWith('uploads/')) {
    const url = `${BACKEND_URL}/${value}`;
    return VIDEO_EXT.test(value) ? { type: 'video', url } : { type: 'audio', url };
  }

  // Direct link to a media file.
  if (AUDIO_EXT.test(value)) return { type: 'audio', url: value };
  if (VIDEO_EXT.test(value)) return { type: 'video', url: value };

  const ytId = parseYouTubeId(value);
  if (ytId) return { type: 'youtube', id: ytId, url: value };

  const spotifyEmbed = parseSpotifyEmbed(value);
  if (spotifyEmbed) return { type: 'spotify', embedUrl: spotifyEmbed, url: value };

  // Unknown source — keep the old click-to-open-link behaviour.
  return { type: 'link', url: value };
}

/**
 * Inline music player. Renders the right element for the source kind:
 * uploaded/linked audio, video, a YouTube embed, a Spotify embed, or a
 * plain external link for anything we can't play in-browser.
 */
export default function MusicPlayer({ src, className }) {
  const source = useMemo(() => detectSource(src), [src]);
  if (!source) return null;

  if (source.type === 'audio') {
    return (
      <audio
        controls
        src={source.url}
        className={cn('w-full', className)}
        data-testid="music-audio"
      />
    );
  }

  if (source.type === 'video') {
    return (
      <video
        controls
        src={source.url}
        className={cn('w-full rounded-md', className)}
        data-testid="music-video"
      />
    );
  }

  if (source.type === 'youtube') {
    return (
      <iframe
        title="YouTube player"
        src={`https://www.youtube.com/embed/${source.id}`}
        className={cn('w-full aspect-video rounded-md', className)}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        data-testid="music-youtube"
      />
    );
  }

  if (source.type === 'spotify') {
    return (
      <div className={className}>
        <iframe
          title="Spotify player"
          src={source.embedUrl}
          className="w-full rounded-md"
          style={{ height: 152 }}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          data-testid="music-spotify"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Full playback requires being logged into Spotify Premium — otherwise a 30-second preview plays.
        </p>
      </div>
    );
  }

  // Fallback: unrecognised source, link out like before.
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex items-center gap-2 text-sm text-primary hover:underline', className)}
      data-testid="music-link"
    >
      <Music className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{source.url}</span>
      <ExternalLink className="h-3 w-3 flex-shrink-0" />
    </a>
  );
}
