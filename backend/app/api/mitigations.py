from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.models.entities import Mitigation
from app.schemas.schemas import MitigationSchema

router = APIRouter(prefix="/mitigations", tags=["Mitigation Strategies"])

@router.get("", response_model=List[MitigationSchema])
def list_mitigations(db: Session = Depends(get_db)):
    mits = db.query(Mitigation).all()
    return mits
