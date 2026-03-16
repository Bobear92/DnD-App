from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from shared.database import get_db
from shared.dependencies import get_current_user
from auth.models import User
from .schemas import LootTableCreate, LootTableUpdate, LootTableResponse
from . import service


router = APIRouter(
    prefix="/api/gm/tools/loot-tables",
    tags=["GM Tools - Loot Tables"]
)


@router.post(
    "",
    response_model=LootTableResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new loot table"
)
def create_loot_table(
    loot_table_data: LootTableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new loot table.
    
    - Admin can create system tables (owner_type='system', owner_id=NULL)
    - GM can create campaign tables (owner_type='campaign', owner_id=campaign_id)
    """
    return service.create_loot_table(db, loot_table_data, current_user.id, current_user.is_admin)


@router.get(
    "",
    response_model=List[LootTableResponse],
    summary="Get all accessible loot tables"
)
def get_all_loot_tables(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all loot tables accessible to the user.
    
    Returns: system tables + campaign tables for campaigns the user is a member of.
    """
    return service.get_all_loot_tables(db, current_user.id, current_user.is_admin)


@router.get(
    "/{loot_table_id}",
    response_model=LootTableResponse,
    summary="Get specific loot table"
)
def get_loot_table(
    loot_table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific loot table by ID.
    
    User must have permission to view it (system table or member of the campaign).
    """
    return service.get_loot_table_by_id(db, loot_table_id, current_user.id, current_user.is_admin)


@router.put(
    "/{loot_table_id}",
    response_model=LootTableResponse,
    summary="Update loot table"
)
def update_loot_table(
    loot_table_id: int,
    loot_table_data: LootTableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a loot table.
    
    - Admin can update system tables
    - GM can update their own campaign tables
    """
    return service.update_loot_table(db, loot_table_id, loot_table_data, current_user.id, current_user.is_admin)


@router.delete(
    "/{loot_table_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete loot table"
)
def delete_loot_table(
    loot_table_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a loot table.
    
    - Admin can delete system tables
    - GM can delete their own campaign tables
    """
    return service.delete_loot_table(db, loot_table_id, current_user.id, current_user.is_admin)