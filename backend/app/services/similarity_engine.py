import math
from typing import List, Dict, Any
from app.core.config import settings

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate great-circle distance between two points on the earth in kilometers.
    """
    R = 6371.0  # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = (math.sin(dLat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dLon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def compute_spatial_similarity(distance_km: float, max_radius_km: float = 25.0) -> float:
    """
    Decay function: Closer offset wells receive higher spatial score (1.0 at 0km, approaching 0 at max_radius).
    """
    if distance_km <= 0:
        return 1.0
    if distance_km >= max_radius_km:
        return 0.05
    # Exponential decay
    return round(math.exp(-3.0 * (distance_km / max_radius_km)), 4)

def compute_trajectory_similarity(active_type: str, offset_type: str, active_inc: float = 28.0, offset_inc: float = 25.0) -> float:
    """
    Compare trajectory profiles (Vertical vs Directional vs Horizontal).
    """
    type_score = 1.0 if active_type == offset_type else (0.6 if "DIRECTIONAL" in (active_type, offset_type) else 0.4)
    inc_diff = abs(active_inc - offset_inc)
    inc_score = max(0.0, 1.0 - (inc_diff / 45.0))
    return round(0.5 * type_score + 0.5 * inc_score, 4)

def compute_stratigraphic_similarity(active_formations: List[str], offset_formations: List[str]) -> float:
    """
    Jaccard overlap coefficient of intersected geological horizons.
    """
    set_a = set(active_formations)
    set_b = set(offset_formations)
    if not set_a or not set_b:
        return 0.5
    intersection = set_a.intersection(set_b)
    union = set_a.union(set_b)
    return round(len(intersection) / len(union), 4)

def compute_architecture_similarity(active_mud: str, offset_mud: str, active_casing_count: int = 4, offset_casing_count: int = 4) -> float:
    """
    Compare hole size, casing shoe depths, and mud system chemistry.
    """
    mud_score = 1.0 if active_mud.lower() == offset_mud.lower() else (0.7 if "polymer" in active_mud.lower() and "polymer" in offset_mud.lower() else 0.5)
    casing_diff = abs(active_casing_count - offset_casing_count)
    casing_score = max(0.4, 1.0 - (casing_diff * 0.2))
    return round(0.6 * mud_score + 0.4 * casing_score, 4)

def calculate_offset_similarity(
    active_well: Any,
    offset_well: Any,
    weights: Dict[str, float] = None
) -> Dict[str, Any]:
    """
    Compute multi-factor similarity score S_ij and generate clear engineering explanation.
    """
    if weights is None:
        weights = {
            "spatial": settings.WEIGHT_SPATIAL,
            "trajectory": settings.WEIGHT_TRAJECTORY,
            "stratigraphic": settings.WEIGHT_STRATIGRAPHIC,
            "architecture": settings.WEIGHT_ARCHITECTURE,
            "max_radius_km": 25.0
        }

    # 1. Distance & Spatial
    dist_km = haversine_distance_km(
        active_well.latitude, active_well.longitude,
        offset_well.latitude, offset_well.longitude
    )
    dist_meters = round(dist_km * 1000, 1)
    s_spatial = compute_spatial_similarity(dist_km, weights.get("max_radius_km", 25.0))

    # 2. Trajectory
    active_traj = getattr(active_well, "trajectory_type", "DIRECTIONAL")
    offset_traj = getattr(offset_well, "trajectory_type", "DIRECTIONAL")
    s_traj = compute_trajectory_similarity(active_traj, offset_traj)

    # 3. Stratigraphy
    active_forms = [
        getattr(getattr(iv, "formation", None), "name", "Barail")
        for iv in getattr(active_well, "formation_intervals", [])
    ] if getattr(active_well, "formation_intervals", None) else ["Alluvium", "Girujan Clay", "Tipam Sandstone", "Barail Sandstone", "Kopili Shale"]
    
    offset_forms = [
        getattr(getattr(iv, "formation", None), "name", "Barail")
        for iv in getattr(offset_well, "formation_intervals", [])
    ] if getattr(offset_well, "formation_intervals", None) else ["Alluvium", "Girujan Clay", "Tipam Sandstone", "Barail Sandstone", "Kopili Shale"]
    
    s_strat = compute_stratigraphic_similarity(active_forms, offset_forms)

    # 4. Architecture
    active_mud = getattr(active_well, "mud_system", "WBM KCl Polymer")
    offset_mud = getattr(offset_well, "mud_system", "WBM KCl Polymer")
    s_arch = compute_architecture_similarity(active_mud, offset_mud)

    # Composite Score S_ij
    w_sum = weights["spatial"] + weights["trajectory"] + weights["stratigraphic"] + weights["architecture"]
    overall_score = (
        weights["spatial"] * s_spatial +
        weights["trajectory"] * s_traj +
        weights["stratigraphic"] * s_strat +
        weights["architecture"] * s_arch
    ) / (w_sum if w_sum > 0 else 1.0)
    overall_score = round(overall_score, 4)

    # Historical Incidents and NPT on offset well
    incidents = getattr(offset_well, "incidents", []) or []
    hazards_list = list(set([inc.hazard_type for inc in incidents]))
    total_npt = sum([inc.NPT_hours for inc in incidents])

    # Explainability text
    dist_text = f"{int(dist_meters)} m away" if dist_meters < 1000 else f"{round(dist_km, 2)} km away"
    strat_pct = int(s_strat * 100)
    traj_text = "identical directional profile" if s_traj > 0.85 else "comparable trajectory"
    arch_text = "matching mud system & casing plan" if s_arch > 0.8 else "similar wellbore architecture"
    
    relevance_explanation = (
        f"{dist_text}, {strat_pct}% stratigraphic formation overlap, {traj_text} "
        f"and {arch_text}. Historically experienced {len(incidents)} drilling events ({round(total_npt, 1)} hrs NPT)."
    )

    return {
        "well_id": offset_well.well_id,
        "UWI": offset_well.UWI,
        "well_name": offset_well.well_name,
        "field_name": offset_well.field_name,
        "distance_meters": dist_meters,
        "overall_similarity_score": overall_score,
        "spatial_similarity": s_spatial,
        "trajectory_similarity": s_traj,
        "stratigraphic_similarity": s_strat,
        "architecture_similarity": s_arch,
        "relevance_explanation": relevance_explanation,
        "historical_hazards_count": len(incidents),
        "total_npt_hours": round(total_npt, 1),
        "encountered_hazards": hazards_list,
        "latitude": offset_well.latitude,
        "longitude": offset_well.longitude,
        "trajectory": getattr(offset_well, "boreholes", [{}])[0].trajectory if getattr(offset_well, "boreholes", None) else None
    }
