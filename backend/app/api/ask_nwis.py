from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.schemas.schemas import AskNWISRequest, AskNWISResponse
from app.services.rag_assistant import answer_nwis_query

router = APIRouter(prefix="/ask-nwis", tags=["Ask NWIS AI Assistant"])

@router.post("", response_model=AskNWISResponse)
def ask_nwis_copilot(req: AskNWISRequest, db: Session = Depends(get_db)):
    result = answer_nwis_query(
        db=db,
        query=req.query,
        active_well_id=req.active_well_id or 1,
        current_formation=req.current_formation or "Barail Sandstone",
        current_depth=req.current_depth or 2845.0
    )
    return result
