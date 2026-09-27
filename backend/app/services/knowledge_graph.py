from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.entities import Well, Borehole, Formation, DrillingIncident, Mitigation

def build_well_knowledge_graph(db: Session, well_id: int = None) -> Dict[str, Any]:
    """
    Builds graph nodes and edges for the Knowledge Graph Explorer:
    Well -> Borehole -> Formation -> Incident -> Mitigation
    """
    nodes = []
    edges = []
    node_ids = set()

    # Query wells
    query = db.query(Well)
    if well_id:
        query = query.filter(Well.well_id == well_id)
    else:
        query = query.limit(8)
    
    wells = query.all()

    for w in wells:
        w_node_id = f"well_{w.well_id}"
        if w_node_id not in node_ids:
            nodes.append({
                "id": w_node_id,
                "label": w.well_name,
                "node_type": "Well",
                "properties": {
                    "UWI": w.UWI,
                    "field": w.field_name,
                    "depth_md": w.total_depth_md,
                    "status": w.status,
                    "rig": w.rig_id
                }
            })
            node_ids.add(w_node_id)

        # Boreholes
        for b in w.boreholes:
            b_node_id = f"borehole_{b.borehole_id}"
            if b_node_id not in node_ids:
                nodes.append({
                    "id": b_node_id,
                    "label": f"Hole {b.hole_size}\" ({b.section_name or 'Section'})",
                    "node_type": "Borehole",
                    "properties": {
                        "hole_size": b.hole_size,
                        "max_inc": b.max_inclination,
                        "td": b.total_depth
                    }
                })
                node_ids.add(b_node_id)
            
            edges.append({
                "id": len(edges) + 1,
                "source": w_node_id,
                "target": b_node_id,
                "relation_type": "HAS_BOREHOLE",
                "properties": {"section": b.section_name}
            })

        # Formation Intervals
        for iv in w.formation_intervals:
            f = iv.formation
            if f:
                f_node_id = f"formation_{f.formation_id}"
                if f_node_id not in node_ids:
                    nodes.append({
                        "id": f_node_id,
                        "label": f.name,
                        "node_type": "Formation",
                        "properties": {
                            "lithology": f.lithology,
                            "top_tvdss": f.top_tvdss,
                            "base_tvdss": f.base_tvdss,
                            "risk": f.risk_level
                        }
                    })
                    node_ids.add(f_node_id)
                
                edges.append({
                    "id": len(edges) + 1,
                    "source": w_node_id,
                    "target": f_node_id,
                    "relation_type": "INTERSECTS_FORMATION",
                    "properties": {
                        "top_md": iv.top_md,
                        "base_md": iv.base_md
                    }
                })

        # Incidents
        for inc in w.incidents:
            inc_node_id = f"incident_{inc.incident_id}"
            if inc_node_id not in node_ids:
                nodes.append({
                    "id": inc_node_id,
                    "label": f"{inc.hazard_type} ({inc.depth_start}m)",
                    "node_type": "Incident",
                    "properties": {
                        "hazard": inc.hazard_type,
                        "depth": f"{inc.depth_start}–{inc.depth_end} m",
                        "severity": inc.severity,
                        "npt": inc.NPT_hours,
                        "source": inc.source_document
                    }
                })
                node_ids.add(inc_node_id)

            edges.append({
                "id": len(edges) + 1,
                "source": w_node_id,
                "target": inc_node_id,
                "relation_type": "EXPERIENCED_EVENT",
                "properties": {"severity": inc.severity}
            })

            # Edge from formation to incident
            if inc.formation_id:
                f_node_id = f"formation_{inc.formation_id}"
                if f_node_id in node_ids:
                    edges.append({
                        "id": len(edges) + 1,
                        "source": f_node_id,
                        "target": inc_node_id,
                        "relation_type": "OCCURRED_IN",
                        "properties": {"eta_norm": inc.eta_norm}
                    })

            # Mitigations
            for mit in inc.mitigations:
                mit_node_id = f"mitigation_{mit.mitigation_id}"
                if mit_node_id not in node_ids:
                    nodes.append({
                        "id": mit_node_id,
                        "label": mit.strategy[:28] + "...",
                        "node_type": "Mitigation",
                        "properties": {
                            "strategy": mit.strategy,
                            "material": mit.material,
                            "sop": mit.SOP_reference,
                            "success": mit.success
                        }
                    })
                    node_ids.add(mit_node_id)

                edges.append({
                    "id": len(edges) + 1,
                    "source": inc_node_id,
                    "target": mit_node_id,
                    "relation_type": "MITIGATED_BY",
                    "properties": {"success": mit.success}
                })

    return {"nodes": nodes, "edges": edges}
