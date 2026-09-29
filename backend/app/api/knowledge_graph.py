from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.schemas.schemas import KnowledgeGraphResponse
from app.services.knowledge_graph import build_well_knowledge_graph

router = APIRouter(prefix="/knowledge-graph", tags=["Knowledge Graph"])

@router.get("/well/{well_id}", response_model=KnowledgeGraphResponse)
def get_well_subgraph(well_id: int, db: Session = Depends(get_db)):
    graph = build_well_knowledge_graph(db, well_id=well_id)
    return graph

@router.get("/full", response_model=KnowledgeGraphResponse)
def get_full_graph(db: Session = Depends(get_db)):
    graph = build_well_knowledge_graph(db, well_id=3)
    return graph
