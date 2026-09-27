from typing import List, Dict, Any
from app.core.config import settings
from app.services.stratigraphy import calculate_tvdss, calculate_eta_norm, get_formation_at_depth
from app.services.similarity_engine import calculate_offset_similarity

def evaluate_lookahead_hazards(
    active_well: Any,
    offset_wells: List[Any],
    current_md: float,
    lookahead_meters: float = 50.0,
    active_telemetry: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Look-ahead engine:
    Evaluates current depth Z to Z + Delta Z.
    Searches offset well knowledge base for historical hazards occurring inside that future interval
    using both raw MD/TVDSS proximity and normalized formation space (eta_norm).
    """
    start_md = current_md
    end_md = current_md + lookahead_meters
    
    # Active well elevation & formation
    kb = getattr(active_well, "KB_elevation", 112.5)
    current_tvd = current_md * 0.94  # directional approximation if exact survey not queried
    current_tvdss = calculate_tvdss(current_tvd, kb)
    lookahead_tvdss_end = calculate_tvdss(end_md * 0.94, kb)
    
    intervals = getattr(active_well, "formation_intervals", [])
    curr_form_info = get_formation_at_depth(intervals, current_md)
    curr_form_name = curr_form_info["formation_name"] if curr_form_info else "Barail Sandstone"
    
    # Target formation boundaries
    target_formations = set()
    top_tvdss = curr_form_info["top_tvdss"] if curr_form_info else 2500.0
    base_tvdss = curr_form_info["base_tvdss"] if curr_form_info else 3000.0
    
    current_eta_norm = calculate_eta_norm(current_tvdss, top_tvdss, base_tvdss)
    lookahead_eta_norm_end = calculate_eta_norm(lookahead_tvdss_end, top_tvdss, base_tvdss)
    
    target_formations.add(curr_form_name)

    # Rank offset wells by similarity
    ranked_offsets = []
    for ow in offset_wells:
        if ow.well_id == active_well.well_id:
            continue
        sim = calculate_offset_similarity(active_well, ow)
        ranked_offsets.append((ow, sim))
    
    # Sort descending by similarity
    ranked_offsets.sort(key=lambda x: x[1]["overall_similarity_score"], reverse=True)
    
    # Scan historical incidents from top relevant offset wells
    detected_hazards = []
    total_relevant_checked = 0
    high_similarity_offsets = [item for item in ranked_offsets if item[1]["overall_similarity_score"] >= 0.50]
    
    for ow, sim in ranked_offsets:
        if sim["distance_meters"] > 25000: # 25km radius filter
            continue
        total_relevant_checked += 1
        
        incidents = getattr(ow, "incidents", []) or []
        for inc in incidents:
            # Check if incident falls within look-ahead formation OR depth window OR eta_norm window
            # Proximity in eta_norm: incident eta_norm in [current_eta_norm - 0.05, lookahead_eta_norm_end + 0.08]
            # OR raw depth interval
            inc_eta = getattr(inc, "eta_norm", 0.5)
            form_name = getattr(getattr(inc, "formation", None), "name", curr_form_name)
            
            is_in_lookahead = False
            # 1. Depth range match
            if start_md - 10 <= inc.depth_start <= end_md + 20:
                is_in_lookahead = True
            # 2. Stratigraphic eta_norm match in same formation
            elif form_name == curr_form_name and (current_eta_norm - 0.05 <= inc_eta <= lookahead_eta_norm_end + 0.10):
                is_in_lookahead = True
                
            if is_in_lookahead:
                mitigations = getattr(inc, "mitigations", []) or []
                mit_data = []
                for m in mitigations:
                    mit_data.append({
                        "strategy": m.strategy,
                        "material": m.material,
                        "volume": m.volume,
                        "soaking_time": m.soaking_time,
                        "success": m.success,
                        "SOP_reference": m.SOP_reference,
                        "operational_remarks": m.operational_remarks
                    })
                
                detected_hazards.append({
                    "incident_id": inc.incident_id,
                    "offset_well_id": ow.well_id,
                    "offset_well_name": ow.well_name,
                    "offset_uwi": ow.UWI,
                    "distance_meters": sim["distance_meters"],
                    "similarity_score": sim["overall_similarity_score"],
                    "relevance_explanation": sim["relevance_explanation"],
                    "hazard_type": inc.hazard_type,
                    "depth_start": inc.depth_start,
                    "depth_end": inc.depth_end,
                    "depth_tvd": inc.depth_tvd,
                    "depth_tvdss": inc.depth_tvdss,
                    "eta_norm": inc.eta_norm,
                    "severity": inc.severity,
                    "NPT_hours": inc.NPT_hours,
                    "volume_loss_m3": inc.volume_loss_m3,
                    "influx_volume_bbl": inc.influx_volume_bbl,
                    "overpull_klbs": inc.overpull_klbs,
                    "description": inc.description,
                    "source_document": inc.source_document,
                    "page_number": inc.page_number,
                    "formation": form_name,
                    "mitigations": mit_data
                })

    # Group detected hazards by hazard_type and compute composite risk
    hazard_counts = {}
    for h in detected_hazards:
        ht = h["hazard_type"]
        hazard_counts[ht] = hazard_counts.get(ht, 0) + 1

    # Base risk calculation
    base_risk = 0.15
    if detected_hazards:
        # Weighted by similarity and proximity
        hazard_weight_sum = sum([h["similarity_score"] * (1.5 if h["severity"] in ["HIGH", "CRITICAL"] else 1.0) for h in detected_hazards])
        base_risk = min(0.95, 0.25 + (hazard_weight_sum * 0.18))
    
    # Telemetry anomaly boost
    telemetry_boost = 0.0
    if active_telemetry and active_telemetry.get("is_anomaly"):
        telemetry_boost = 0.22
    
    overall_risk = min(0.98, round(base_risk + telemetry_boost, 2))
    
    # Determine risk category
    if overall_risk >= settings.RISK_THRESHOLD_CRITICAL:
        risk_cat = "CRITICAL"
    elif overall_risk >= settings.RISK_THRESHOLD_HIGH:
        risk_cat = "HIGH"
    elif overall_risk >= settings.RISK_THRESHOLD_MODERATE:
        risk_cat = "MODERATE"
    else:
        risk_cat = "LOW"

    # Explainability synthesis
    if detected_hazards:
        top_h = detected_hazards[0]
        why_text = (
            f"Risk elevated to {risk_cat} ({int(overall_risk*100)}%) because {len(detected_hazards)} historical incidents "
            f"were identified across {len(set([h['offset_well_name'] for h in detected_hazards]))} relevant offset wells "
            f"within the next {lookahead_meters} m window in {curr_form_name} (eta_norm ~ {round(current_eta_norm, 2)} - {round(lookahead_eta_norm_end, 2)}). "
            f"Closest offset {top_h['offset_well_name']} ({int(top_h['distance_meters'])} m away) experienced {top_h['hazard_type']} with {top_h['NPT_hours']} hrs NPT."
        )
    else:
        why_text = (
            f"Risk is {risk_cat} ({int(overall_risk*100)}%). No major historical hazards recorded by nearby offset wells "
            f"in the next {lookahead_meters} m lookahead interval ({curr_form_name}). Normal drilling parameters observed."
        )

    return {
        "current_depth_md": round(start_md, 2),
        "current_depth_tvdss": round(current_tvdss, 2),
        "lookahead_window_m": lookahead_meters,
        "target_interval_start_md": round(start_md, 2),
        "target_interval_end_md": round(end_md, 2),
        "current_formation": curr_form_name,
        "target_formations": list(target_formations),
        "current_eta_norm": round(current_eta_norm, 4),
        "lookahead_eta_norm_end": round(lookahead_eta_norm_end, 4),
        "overall_risk_score": overall_risk,
        "overall_risk_category": risk_cat,
        "detected_hazards": detected_hazards,
        "hazard_summary_counts": hazard_counts,
        "why_risk_increased": why_text,
        "offset_wells_evaluated": len(offset_wells),
        "relevant_offsets_count": len(high_similarity_offsets)
    }
