from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class Shot(BaseModel):
    horizontal: str = Field(..., description="Horizontal position (Left, Center Left, Center, Center Right, Right)")
    depth: str = Field(..., description="Depth position (Back, Mid Back, Mid, Mid Front, Front)")
    space: int = Field(..., ge=1, le=2, description="Space number (1 or 2)")

class SequenceSettings(BaseModel):
    minDistance: Optional[float] = Field(None, ge=0, description="Minimum distance between shots")
    maxDistance: Optional[float] = Field(None, ge=0, description="Maximum distance between shots")

class SequenceCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="Sequence name")
    shots: List[Shot] = Field(..., min_items=1, max_items=100, description="List of shots in sequence")
    settings: Optional[SequenceSettings] = Field(None, description="Generation settings")

class SequenceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100, description="Updated sequence name")
    shots: Optional[List[Shot]] = Field(None, min_items=1, max_items=100, description="Updated shots list")
    settings: Optional[SequenceSettings] = Field(None, description="Updated settings")

class SequenceMetadata(BaseModel):
    totalShots: int
    createdAt: str
    updatedAt: Optional[str] = None

class SequenceResponse(BaseModel):
    id: str
    name: str
    shots: List[Shot]
    settings: Optional[SequenceSettings]
    metadata: Optional[SequenceMetadata]
    createdAt: str
    updatedAt: str

class SequenceListItem(BaseModel):
    id: str
    name: str
    totalShots: int
    createdAt: str
    updatedAt: str

class ErrorResponse(BaseModel):
    detail: str