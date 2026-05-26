from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional

from . import service, schemas
from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User

router = APIRouter(prefix="/api/classes", tags=["Classes"])


@router.get("", response_model=List[schemas.ClassResponse])
def get_classes(
    edition: Optional[str] = None,
    campaign_id: Optional[int] = None,
    name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_all_classes(db, edition=edition, campaign_id=campaign_id, name=name)


@router.get("/{class_id}", response_model=schemas.ClassResponse)
def get_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_class_by_id(db, class_id)


@router.post("", response_model=schemas.ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(
    data: schemas.ClassCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.create_class(db, data, current_user.id, current_user.is_admin)


@router.put("/{class_id}", response_model=schemas.ClassResponse)
def update_class(
    class_id: int,
    data: schemas.ClassUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_class(db, class_id, data, current_user.id, current_user.is_admin)


@router.delete("/{class_id}")
def delete_class(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.delete_class(db, class_id, current_user.id, current_user.is_admin)


@router.post("/{class_id}/features", response_model=schemas.ClassFeatureResponse, status_code=status.HTTP_201_CREATED)
def add_feature(
    class_id: int,
    data: schemas.ClassFeatureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.add_feature(db, class_id, data, current_user.id, current_user.is_admin)


@router.put("/features/{feature_id}", response_model=schemas.ClassFeatureResponse)
def update_feature(
    feature_id: int,
    data: schemas.ClassFeatureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.update_feature(db, feature_id, data, current_user.id, current_user.is_admin)


@router.delete("/features/{feature_id}")
def delete_feature(
    feature_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.delete_feature(db, feature_id, current_user.id, current_user.is_admin)
