from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from shared.database import Base

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    edition = Column(String(10), default="5e", nullable=False)
    use_alignment = Column(Boolean, default=True, nullable=False)
    ability_score_method = Column(String(20), default="standard_spread", nullable=False)
    allow_reroll_ones = Column(Boolean, default=False, nullable=False)
    leveling_type = Column(String(20), default="milestone", nullable=False)
    currency_type = Column(String(20), default="standard", nullable=False)  # "standard" (cp/sp/gp/pp) | "full" (+ ep)
    starting_equipment = Column(String(20), default="equipment", nullable=False)  # "equipment" | "equipment_or_gold" | "none"
    asi_feat_mode = Column(String(20), default="asi_or_feat", nullable=False)  # "asi_only" | "asi_or_feat" | "asi_and_feat" — what an ASI level grants
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    members = relationship("CampaignMember", back_populates="campaign")
    
    def __repr__(self):
        return f"<Campaign(id={self.id}, name='{self.name}')>"


class CampaignMember(Base):
    __tablename__ = "campaign_members"
    
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String(20), nullable=False)  # 'gm' or 'player'
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    campaign = relationship("Campaign", back_populates="members")
    user = relationship("User")
    
    def __repr__(self):
        return f"<CampaignMember(campaign_id={self.campaign_id}, user_id={self.user_id}, role='{self.role}')>"