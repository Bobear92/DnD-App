import enum

class OwnerType(enum.Enum):
    """
    Ownership type for content that can be system-wide or campaign-specific.
    Used by: Races, Backgrounds, Feats, Classes, etc.
    """
    system = "system"      # Admin-created base D&D content
    campaign = "campaign"  # GM-created custom content