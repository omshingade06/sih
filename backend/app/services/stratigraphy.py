from typing import Optional, Dict, Any, List

def calculate_tvdss(tvd: float, kb_elevation: float) -> float:
    """
    TVDSS = TVD - KB elevation (m below Mean Sea Level)
    """
    return round(tvd - kb_elevation, 2)

def calculate_eta_norm(tvdss: float, top_tvdss: float, base_tvdss: float) -> float:
    """
    Normalized formation coordinate:
    eta_norm = (TVDSS - TVDSS_top) / (TVDSS_base - TVDSS_top)
    0.0 = Formation Top
    1.0 = Formation Base
    """
    if base_tvdss == top_tvdss:
        return 0.0
    eta = (tvdss - top_tvdss) / (base_tvdss - top_tvdss)
    return round(eta, 4)

def get_formation_at_depth(intervals: List[Any], md: float) -> Optional[Dict[str, Any]]:
    """
    Find which formation interval contains the given Measured Depth (MD).
    """
    for interval in intervals:
        if isinstance(interval, dict):
            top = interval.get("top_md")
            base = interval.get("base_md")
            f_name = interval.get("formation_name") or "Unknown Formation"
            f_id = interval.get("formation_id")
            top_tvdss = interval.get("top_tvdss", 0.0)
            base_tvdss = interval.get("base_tvdss", 0.0)
        else:
            top = getattr(interval, "top_md", None)
            base = getattr(interval, "base_md", None)
            f_name = getattr(getattr(interval, "formation", None), "name", None) or getattr(interval, "formation_name", "Unknown Formation")
            f_id = getattr(interval, "formation_id", None)
            top_tvdss = getattr(interval, "top_tvdss", 0.0)
            base_tvdss = getattr(interval, "base_tvdss", 0.0)

        if top is not None and base is not None and top <= md <= base:
            return {
                "formation_id": f_id,
                "formation_name": f_name,
                "top_md": top,
                "base_md": base,
                "top_tvdss": top_tvdss,
                "base_tvdss": base_tvdss
            }
    return None

def normalize_incident_stratigraphy(incident_tvdss: float, form_top_tvdss: float, form_base_tvdss: float) -> float:
    """
    Compute eta_norm for a historical incident given the formation boundaries.
    """
    return calculate_eta_norm(incident_tvdss, form_top_tvdss, form_base_tvdss)
