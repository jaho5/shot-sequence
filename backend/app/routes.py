from fastapi import APIRouter, HTTPException, status
from typing import List
from .models import (
    SequenceCreate, 
    SequenceUpdate, 
    SequenceResponse, 
    SequenceListItem,
    ErrorResponse
)
from .database import SequenceDB

router = APIRouter(prefix="/api", tags=["sequences"])

@router.post("/sequences", response_model=SequenceResponse, status_code=status.HTTP_201_CREATED)
async def create_sequence(sequence: SequenceCreate):
    """Create a new shot sequence."""
    try:
        # Convert shots to dict format for database
        shots_data = [shot.dict() for shot in sequence.shots]
        settings_data = sequence.settings.dict() if sequence.settings else None
        
        sequence_id = SequenceDB.create_sequence(
            name=sequence.name,
            shots=shots_data,
            settings=settings_data
        )
        
        # Return the created sequence
        created_sequence = SequenceDB.get_sequence(sequence_id)
        if not created_sequence:
            raise HTTPException(status_code=500, detail="Failed to create sequence")
        
        return created_sequence
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/sequences", response_model=List[SequenceListItem])
async def get_all_sequences():
    """Get all saved sequences (summary view)."""
    try:
        sequences = SequenceDB.get_all_sequences()
        return sequences
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/sequences/{sequence_id}", response_model=SequenceResponse)
async def get_sequence(sequence_id: str):
    """Get a specific sequence by ID."""
    try:
        sequence = SequenceDB.get_sequence(sequence_id)
        if not sequence:
            raise HTTPException(status_code=404, detail="Sequence not found")
        
        return sequence
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/sequences/{sequence_id}", response_model=SequenceResponse)
async def update_sequence(sequence_id: str, sequence_update: SequenceUpdate):
    """Update an existing sequence."""
    try:
        # Check if sequence exists
        existing = SequenceDB.get_sequence(sequence_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Sequence not found")
        
        # Prepare update data
        shots_data = None
        if sequence_update.shots:
            shots_data = [shot.dict() for shot in sequence_update.shots]
        
        settings_data = None
        if sequence_update.settings:
            settings_data = sequence_update.settings.dict()
        
        # Update sequence
        success = SequenceDB.update_sequence(
            sequence_id=sequence_id,
            name=sequence_update.name,
            shots=shots_data,
            settings=settings_data
        )
        
        if not success:
            raise HTTPException(status_code=404, detail="Sequence not found")
        
        # Return updated sequence
        updated_sequence = SequenceDB.get_sequence(sequence_id)
        return updated_sequence
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.delete("/sequences/{sequence_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sequence(sequence_id: str):
    """Delete a sequence."""
    try:
        success = SequenceDB.delete_sequence(sequence_id)
        if not success:
            raise HTTPException(status_code=404, detail="Sequence not found")
        
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")