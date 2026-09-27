import datetime
import random
import json
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.entities import (
    User, Well, Borehole, Formation, WellFormationInterval,
    DrillingIncident, Mitigation, Telemetry, Alert,
    Document, DocumentExtraction, VerificationRecord, AuditLog,
    DepthReading, KnowledgeNode, KnowledgeEdge
)
from app.services.stratigraphy import calculate_tvdss, calculate_eta_norm

def seed_database():
    import app.models.entities  # ensure all models are registered in Base.metadata
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()
    db.query(Telemetry).delete()
    db.query(Mitigation).delete()
    db.query(DrillingIncident).delete()
    db.query(WellFormationInterval).delete()
    db.query(Borehole).delete()
    db.query(DepthReading).delete()
    db.query(Well).delete()
    db.query(Formation).delete()
    db.query(User).delete()
    db.commit()

    print("Seeding eRTMAC-NWIS database with Oil India Limited (Upper Assam Basin) & Synthetic benchmark wells...")

    # 1. Users
    users_data = [
        {"username": "admin", "email": "admin@oilindia.in", "full_name": "Chief Drilling Engineer (Admin)", "role": "ADMIN", "pwd": "admin"},
        {"username": "driller", "email": "drilling.eng@oilindia.in", "full_name": "Er. Rajesh Sarmah (RTDC Lead)", "role": "DRILLING_ENGINEER", "pwd": "oil123"},
        {"username": "geologist", "email": "geology.ops@oilindia.in", "full_name": "Dr. Ananya Dutta (Senior Geoscientist)", "role": "GEOLOGIST", "pwd": "oil123"},
        {"username": "viewer", "email": "viewer@oilindia.in", "full_name": "Operations Stakeholder (Observer)", "role": "VIEWER", "pwd": "oil123"}
    ]
    for u in users_data:
        user = User(
            username=u["username"],
            email=u["email"],
            full_name=u["full_name"],
            role=u["role"],
            hashed_password=get_password_hash(u["pwd"]),
            is_active=True
        )
        db.add(user)
    db.commit()

    # 2. Formations (Upper Assam Basin Geological Column)
    formations_data = [
        {"name": "Alluvium", "lithology": "Sand & Gravel", "top_tvdss": 0.0, "base_tvdss": 350.0, "pressure": 1.02, "frac": 1.45, "risk": "LOW", "desc": "Unconsolidated recent gravels and river sand deposits."},
        {"name": "Dhekiajuli Formation", "lithology": "Coarse Sandstone with Clay", "top_tvdss": 350.0, "base_tvdss": 950.0, "pressure": 1.05, "frac": 1.50, "risk": "LOW", "desc": "Pliocene massive sandstones with clay intercalations, freshwater aquifers."},
        {"name": "Girujan Clay", "lithology": "Variegated Claystone & Shale", "top_tvdss": 950.0, "base_tvdss": 1650.0, "pressure": 1.10, "frac": 1.58, "risk": "MODERATE", "desc": "Miocene plastic, reactive montmorillonite clays prone to swelling and tight hole."},
        {"name": "Tipam Sandstone", "lithology": "Medium to Coarse Sandstone", "top_tvdss": 1650.0, "base_tvdss": 2300.0, "pressure": 1.14, "frac": 1.62, "risk": "MODERATE", "desc": "Major hydrocarbon reservoir in Nahorkatiya and Moran fields. Interbedded shales."},
        {"name": "Surma Group", "lithology": "Alternating Sandstone & Shale", "top_tvdss": 2300.0, "base_tvdss": 2480.0, "pressure": 1.18, "frac": 1.65, "risk": "MODERATE", "desc": "Transitional marine and deltaic sandstone/shale sequences."},
        {"name": "Barail Arenaceous (Sandstone)", "lithology": "Fine to Medium Sandstone", "top_tvdss": 2480.0, "base_tvdss": 2920.0, "pressure": 1.22, "frac": 1.70, "risk": "HIGH", "desc": "Oligocene prime oil and gas reservoir. Sub-hydrostatic zones prone to severe lost circulation and differential sticking."},
        {"name": "Barail Argillaceous (Coal-Shale)", "lithology": "Carbonaceous Shale & Coal", "top_tvdss": 2920.0, "base_tvdss": 3180.0, "pressure": 1.25, "frac": 1.72, "risk": "HIGH", "desc": "Thick coal beds and brittle shales. Prone to borehole sloughing and pack-offs."},
        {"name": "Kopili Shale", "lithology": "Fissile Marine Shale & Calcareous Siltstone", "top_tvdss": 3180.0, "base_tvdss": 3550.0, "pressure": 1.30, "frac": 1.78, "risk": "CRITICAL", "desc": "Eocene high-pressure overpressured marine shale with severe sloughing tendencies and gas kicks."},
        {"name": "Sylhet Limestone", "lithology": "Nummulitic Limestone & Dolomite", "top_tvdss": 3550.0, "base_tvdss": 3950.0, "pressure": 1.26, "frac": 1.82, "risk": "HIGH", "desc": "Karstic, vuggy limestone reservoir. High potential for massive cavernous lost circulation."},
        {"name": "Precambrian Basement", "lithology": "Granite Gneiss", "top_tvdss": 3950.0, "base_tvdss": 4500.0, "pressure": 1.15, "frac": 1.95, "risk": "LOW", "desc": "Metamorphic basement rock."}
    ]

    form_objects = {}
    for f in formations_data:
        form = Formation(
            name=f["name"],
            basin="Upper Assam Basin",
            lithology=f["lithology"],
            top_tvdss=f["top_tvdss"],
            base_tvdss=f["base_tvdss"],
            pressure_baseline=f["pressure"],
            fracture_gradient=f["frac"],
            risk_level=f["risk"],
            description=f["desc"]
        )
        db.add(form)
        form_objects[f["name"]] = form
    db.commit()

    # 3. Wells: Operational Demo Wells + Synthetic Benchmark Wells
    wells_data = [
        # Active Drilling Well
        {"id": 1, "uwi": "IN-OIL-AS-NHK-412", "name": "OIL-DEMO-001 (NHK-412)", "field": "Nahorkatiya", "lat": 27.3025, "lon": 95.3412, "td_md": 3550.0, "td_tvd": 3320.0, "kb": 112.5, "status": "ACTIVE", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl PHPA Polymer", "cur_md": 2845.0, "cur_tvd": 2680.0, "rig": "OIL-RIG-14"},
        # Nearest Highly Relevant Offsets
        {"id": 2, "uwi": "IN-OIL-AS-NHK-388", "name": "OIL-DEMO-002 (NHK-388)", "field": "Nahorkatiya", "lat": 27.3072, "lon": 95.3445, "td_md": 3420.0, "td_tvd": 3180.0, "kb": 113.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl PHPA Polymer", "cur_md": 3420.0, "cur_tvd": 3180.0, "rig": "OIL-RIG-08"},
        {"id": 3, "uwi": "IN-OIL-AS-NHK-395", "name": "OIL-DEMO-003 (NHK-395)", "field": "Nahorkatiya", "lat": 27.2980, "lon": 95.3370, "td_md": 3600.0, "td_tvd": 3350.0, "kb": 112.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl PHPA Polymer", "cur_md": 3600.0, "cur_tvd": 3350.0, "rig": "OIL-RIG-11"},
        {"id": 4, "uwi": "IN-OIL-AS-NHK-402", "name": "OIL-DEMO-004 (NHK-402)", "field": "Nahorkatiya", "lat": 27.3110, "lon": 95.3490, "td_md": 3380.0, "td_tvd": 3150.0, "kb": 114.2, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl PHPA Polymer", "cur_md": 3380.0, "cur_tvd": 3150.0, "rig": "OIL-RIG-19"},
        {"id": 5, "uwi": "IN-OIL-AS-NHK-375", "name": "OIL-DEMO-005 (NHK-375)", "field": "Nahorkatiya", "lat": 27.2915, "lon": 95.3315, "td_md": 3720.0, "td_tvd": 3480.0, "kb": 111.8, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "VERTICAL", "mud": "WBM KCl Polymer", "cur_md": 3720.0, "cur_tvd": 3480.0, "rig": "OIL-RIG-06"},
        # Moran Field Offsets
        {"id": 6, "uwi": "IN-OIL-AS-MOR-108", "name": "OIL-DEMO-006 (MOR-108)", "field": "Moran", "lat": 27.1850, "lon": 94.9200, "td_md": 3850.0, "td_tvd": 3600.0, "kb": 108.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3850.0, "cur_tvd": 3600.0, "rig": "OIL-RIG-15"},
        {"id": 7, "uwi": "IN-OIL-AS-MOR-112", "name": "OIL-DEMO-007 (MOR-112)", "field": "Moran", "lat": 27.1920, "lon": 94.9280, "td_md": 3920.0, "td_tvd": 3680.0, "kb": 109.5, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3920.0, "cur_tvd": 3680.0, "rig": "OIL-RIG-09"},
        {"id": 8, "uwi": "IN-OIL-AS-MOR-119", "name": "OIL-DEMO-008 (MOR-119)", "field": "Moran", "lat": 27.1780, "lon": 94.9120, "td_md": 4100.0, "td_tvd": 3850.0, "kb": 107.2, "status": "COMPLETED", "type": "EXPLORATION", "traj": "DIRECTIONAL", "mud": "OBM Synthetic", "cur_md": 4100.0, "cur_tvd": 3850.0, "rig": "OIL-RIG-22"},
        # Dikom & Jorajan Offsets
        {"id": 9, "uwi": "IN-OIL-AS-DKM-024", "name": "OIL-DEMO-009 (DKM-024)", "field": "Dikom", "lat": 27.4200, "lon": 95.1200, "td_md": 3650.0, "td_tvd": 3410.0, "kb": 118.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3650.0, "cur_tvd": 3410.0, "rig": "OIL-RIG-17"},
        {"id": 10, "uwi": "IN-OIL-AS-DKM-031", "name": "OIL-DEMO-010 (DKM-031)", "field": "Dikom", "lat": 27.4280, "lon": 95.1290, "td_md": 3710.0, "td_tvd": 3460.0, "kb": 119.5, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3710.0, "cur_tvd": 3460.0, "rig": "OIL-RIG-12"},
        {"id": 11, "uwi": "IN-OIL-AS-JRJ-065", "name": "OIL-DEMO-011 (JRJ-065)", "field": "Jorajan", "lat": 27.3500, "lon": 95.4800, "td_md": 4250.0, "td_tvd": 3980.0, "kb": 125.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "HORIZONTAL", "mud": "WBM KCl Glycol", "cur_md": 4250.0, "cur_tvd": 3980.0, "rig": "OIL-RIG-03"},
        {"id": 12, "uwi": "IN-OIL-AS-JRJ-072", "name": "OIL-DEMO-012 (JRJ-072)", "field": "Jorajan", "lat": 27.3580, "lon": 95.4910, "td_md": 4310.0, "td_tvd": 4020.0, "kb": 126.5, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Glycol", "cur_md": 4310.0, "cur_tvd": 4020.0, "rig": "OIL-RIG-05"},
        # Additional Regional Offsets (Kusijan, Digboi, Shalmari, Hapjan, Kumchai, Borbil)
        {"id": 13, "uwi": "IN-OIL-AS-KSJ-015", "name": "OIL-DEMO-013 (KSJ-015)", "field": "Kusijan", "lat": 27.2800, "lon": 95.2900, "td_md": 3950.0, "td_tvd": 3720.0, "kb": 115.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3950.0, "cur_tvd": 3720.0, "rig": "OIL-RIG-02"},
        {"id": 14, "uwi": "IN-OIL-AS-KSJ-022", "name": "OIL-DEMO-014 (KSJ-022)", "field": "Kusijan", "lat": 27.2860, "lon": 95.2980, "td_md": 4020.0, "td_tvd": 3780.0, "kb": 116.5, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 4020.0, "cur_tvd": 3780.0, "rig": "OIL-RIG-07"},
        {"id": 15, "uwi": "IN-OIL-AS-DGB-201", "name": "OIL-DEMO-015 (DGB-201)", "field": "Digboi", "lat": 27.3900, "lon": 95.6200, "td_md": 2400.0, "td_tvd": 2350.0, "kb": 135.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "VERTICAL", "mud": "WBM Bentonite", "cur_md": 2400.0, "cur_tvd": 2350.0, "rig": "OIL-RIG-01"},
        {"id": 16, "uwi": "IN-OIL-AS-DGB-215", "name": "OIL-DEMO-016 (DGB-215)", "field": "Digboi", "lat": 27.3980, "lon": 95.6310, "td_md": 2650.0, "td_tvd": 2580.0, "kb": 138.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM Bentonite", "cur_md": 2650.0, "cur_tvd": 2580.0, "rig": "OIL-RIG-04"},
        {"id": 17, "uwi": "IN-OIL-AS-SHL-008", "name": "OIL-DEMO-017 (SHL-008)", "field": "Shalmari", "lat": 27.2200, "lon": 95.1800, "td_md": 3800.0, "td_tvd": 3550.0, "kb": 110.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3800.0, "cur_tvd": 3550.0, "rig": "OIL-RIG-10"},
        {"id": 18, "uwi": "IN-OIL-AS-SHL-014", "name": "OIL-DEMO-018 (SHL-014)", "field": "Shalmari", "lat": 27.2290, "lon": 95.1890, "td_md": 3880.0, "td_tvd": 3620.0, "kb": 111.5, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3880.0, "cur_tvd": 3620.0, "rig": "OIL-RIG-13"},
        {"id": 19, "uwi": "IN-OIL-AS-HPJ-041", "name": "OIL-DEMO-019 (HPJ-041)", "field": "Hapjan", "lat": 27.4600, "lon": 95.3800, "td_md": 4150.0, "td_tvd": 3890.0, "kb": 122.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Glycol", "cur_md": 4150.0, "cur_tvd": 3890.0, "rig": "OIL-RIG-16"},
        {"id": 20, "uwi": "IN-OIL-AS-HPJ-055", "name": "OIL-DEMO-020 (HPJ-055)", "field": "Hapjan", "lat": 27.4680, "lon": 95.3920, "td_md": 4200.0, "td_tvd": 3930.0, "kb": 123.5, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Glycol", "cur_md": 4200.0, "cur_tvd": 3930.0, "rig": "OIL-RIG-18"},
        {"id": 21, "uwi": "IN-OIL-AR-KMC-003", "name": "OIL-DEMO-021 (KMC-003)", "field": "Kumchai", "lat": 27.5200, "lon": 95.8500, "td_md": 5100.0, "td_tvd": 4850.0, "kb": 165.0, "status": "COMPLETED", "type": "EXPLORATION", "traj": "DIRECTIONAL", "mud": "OBM Synthetic", "cur_md": 5100.0, "cur_tvd": 4850.0, "rig": "OIL-RIG-20"},
        {"id": 22, "uwi": "IN-OIL-AS-BBL-011", "name": "OIL-DEMO-022 (BBL-011)", "field": "Borbil", "lat": 27.3300, "lon": 95.2500, "td_md": 3600.0, "td_tvd": 3380.0, "kb": 114.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3600.0, "cur_tvd": 3380.0, "rig": "OIL-RIG-21"},
        # Synthetic Benchmark Wells (Explicitly requested in Section 19)
        {"id": 23, "uwi": "IN-SYN-001-DIFF-STICK", "name": "WELL-SYN-001 (Benchmark)", "field": "Synthetic Test Basin", "lat": 27.3050, "lon": 95.3430, "td_md": 3450.0, "td_tvd": 3210.0, "kb": 112.5, "status": "COMPLETED", "type": "APPRAISAL", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3450.0, "cur_tvd": 3210.0, "rig": "SYN-RIG-01"},
        {"id": 24, "uwi": "IN-SYN-002-PART-LOSS", "name": "WELL-SYN-002 (Benchmark)", "field": "Synthetic Test Basin", "lat": 27.3010, "lon": 95.3390, "td_md": 3500.0, "td_tvd": 3260.0, "kb": 112.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3500.0, "cur_tvd": 3260.0, "rig": "SYN-RIG-02"},
        {"id": 25, "uwi": "IN-SYN-003-KICK-INFLUX", "name": "WELL-SYN-003 (Benchmark)", "field": "Synthetic Test Basin", "lat": 27.3080, "lon": 95.3470, "td_md": 3750.0, "td_tvd": 3500.0, "kb": 113.0, "status": "COMPLETED", "type": "EXPLORATION", "traj": "VERTICAL", "mud": "WBM High Inhibitive", "cur_md": 3750.0, "cur_tvd": 3500.0, "rig": "SYN-RIG-03"}
    ]

    well_objects = {}
    for w in wells_data:
        well = Well(
            well_id=w["id"],
            UWI=w["uwi"],
            well_name=w["name"],
            field_name=w["field"],
            basin="Upper Assam Basin",
            operator="Oil India Limited (OIL)" if "DEMO" in w["name"] else "Synthetic Drilling Intelligence",
            latitude=w["lat"],
            longitude=w["lon"],
            total_depth_md=w["td_md"],
            total_depth_tvd=w["td_tvd"],
            KB_elevation=w["kb"],
            spud_date="2025-10-15",
            rig_id=w["rig"],
            status=w["status"],
            well_type=w["type"],
            trajectory_type=w["traj"],
            mud_system=w["mud"],
            current_bit_depth_md=w["cur_md"],
            current_bit_depth_tvd=w["cur_tvd"],
            casing_program=[
                {"section": "20in Conductor", "shoe_md": 120.0, "shoe_tvd": 120.0, "size_in": 20.0},
                {"section": "13-3/8in Surface", "shoe_md": 1100.0, "shoe_tvd": 1050.0, "size_in": 13.375},
                {"section": "9-5/8in Intermediate", "shoe_md": 2450.0, "shoe_tvd": 2300.0, "size_in": 9.625},
                {"section": "7in Production Liner", "shoe_md": 3550.0, "shoe_tvd": 3320.0, "size_in": 7.0}
            ]
        )
        db.add(well)
        well_objects[w["id"]] = well
    db.commit()

    # 4. Boreholes and Stratigraphic Intervals for all wells
    for w_id, w_obj in well_objects.items():
        bh = Borehole(
            well_id=w_id,
            hole_size=8.5,
            section_name="8-1/2 Production Hole",
            max_inclination=24.5 if w_obj.trajectory_type == "DIRECTIONAL" else 0.5,
            total_depth=w_obj.total_depth_md,
            trajectory=[
                {"md": 0.0, "tvd": 0.0, "inc": 0.0, "azim": 0.0},
                {"md": 1100.0, "tvd": 1080.0, "inc": 8.0, "azim": 45.0},
                {"md": 2450.0, "tvd": 2310.0, "inc": 22.0, "azim": 48.0},
                {"md": w_obj.total_depth_md, "tvd": w_obj.total_depth_tvd, "inc": 24.5, "azim": 50.0}
            ]
        )
        db.add(bh)

        # Formations intersected
        for f_name, f_obj in form_objects.items():
            top_tvd = f_obj.top_tvdss + w_obj.KB_elevation
            base_tvd = f_obj.base_tvdss + w_obj.KB_elevation
            w_int = WellFormationInterval(
                well_id=w_id,
                formation_id=f_obj.formation_id,
                top_md=round(top_tvd * 1.06, 1),
                base_md=round(base_tvd * 1.06, 1),
                top_tvd=round(top_tvd, 1),
                base_tvd=round(base_tvd, 1),
                top_tvdss=f_obj.top_tvdss,
                base_tvdss=f_obj.base_tvdss,
                verification_status="VERIFIED"
            )
            db.add(w_int)
    db.commit()

    # 5. Seed Historical Incidents & Mitigations
    incidents_seed = [
        # WELL-SYN-001: Differential Sticking Benchmark
        {
            "well_id": 23,
            "form": "Barail Arenaceous (Sandstone)",
            "hazard": "Differential Sticking",
            "md_start": 2880.0,
            "md_end": 2885.0,
            "severity": "HIGH",
            "npt": 22.5,
            "overpull": 75.0,
            "desc": "Drill string differentially stuck across depleted Barail sandstone reservoir during survey connection.",
            "doc": "WCR_WELL_SYN_001_Final.pdf",
            "page": 4,
            "mit": {
                "strat": "Lubricant Spotting & Controlled Upward Jarring",
                "mat": "Pipe-Lax / Glycol-based spotting fluid (18 m³)",
                "vol": "18 m³",
                "soak": "3.5 hours",
                "sop": "OIL-SOP-DRL-038 Rev.2",
                "remarks": "Spotted 18 m3 lubricant around BHA, jarred upward on 14th stroke. String freed cleanly."
            }
        },
        # WELL-SYN-002: Partial Lost Circulation Benchmark
        {
            "well_id": 24,
            "form": "Tipam Sandstone",
            "hazard": "Lost Circulation",
            "md_start": 2150.0,
            "md_end": 2162.0,
            "severity": "HIGH",
            "npt": 14.0,
            "vol_loss": 32.0,
            "desc": "Partial loss of 15 m³/hr encountered in fractured Tipam sandstone, escalated to 32 m³ cumulative mud loss.",
            "doc": "DDR_WELL_SYN_002_Section12.25.pdf",
            "page": 2,
            "mit": {
                "strat": "Medium-Coarse LCM Pill Placement",
                "mat": "Nut Plug (15 ppb) + Calcium Carbonate (25 ppb)",
                "vol": "22 m³",
                "soak": "3.0 hours",
                "sop": "OIL-SOP-DRL-042 Rev.3",
                "remarks": "Pumped 22 m3 LCM pill into thief zone, squeezed 5 m3 at 1.5 bpm. Full returns restored."
            }
        },
        # WELL-SYN-003: Possible Influx / Gas Kick Benchmark
        {
            "well_id": 25,
            "form": "Kopili Shale",
            "hazard": "Gas Kick",
            "md_start": 3340.0,
            "md_end": 3348.0,
            "severity": "CRITICAL",
            "npt": 36.0,
            "desc": "Pore pressure ramp in overpressured Kopili marine shale caused 18 bbl pit gain and standpipe pressure drop.",
            "doc": "MUDLOG_WELL_SYN_003_Kopili.pdf",
            "page": 6,
            "mit": {
                "strat": "Driller's Method Well Control & Mud Weight Increase",
                "mat": "Barite weighted KCl PHPA mud (from 1.22 SG to 1.34 SG)",
                "vol": "85 m³",
                "soak": "6.0 hours",
                "sop": "OIL-SOP-WOC-012 Rev.4",
                "remarks": "Shut in on annular BOP, circulated out influx gas bubble via choke manifold. Weighted up system."
            }
        },
        # Operational Field Incident in NHK-388
        {
            "well_id": 2,
            "form": "Barail Arenaceous (Sandstone)",
            "hazard": "Lost Circulation",
            "md_start": 2862.0,
            "md_end": 2874.0,
            "severity": "HIGH",
            "npt": 18.5,
            "vol_loss": 45.0,
            "desc": "Severe circulation loss at 2862m MD in sub-hydrostatic Barail member. Pit volume dropped by 45 m3.",
            "doc": "WCR_OIL_NHK_388_Final.pdf",
            "page": 8,
            "mit": {
                "strat": "High-Permeability LCM Pill (Nut Plug 20 ppb + Mica 15 ppb + coarse CaCO3 10 ppb)",
                "mat": "Nut Plug + Mica + Calcium Carbonate blend",
                "vol": "25 m³",
                "soak": "4.0 hours",
                "sop": "OIL-SOP-DRL-042 Rev.3",
                "remarks": "Spotted 25 m3 LCM pill, soaked 4.0 hours. Returns established cleanly."
            }
        },
        # Operational Field Incident in NHK-402
        {
            "well_id": 4,
            "form": "Barail Arenaceous (Sandstone)",
            "hazard": "Differential Sticking",
            "md_start": 2880.0,
            "md_end": 2888.0,
            "severity": "HIGH",
            "npt": 22.0,
            "overpull": 75.0,
            "desc": "Drill string differentially stuck across permeable Barail sand during connection. Overpull 75 klbs.",
            "doc": "DDR_OIL_NHK_402_Section8.5.pdf",
            "page": 2,
            "mit": {
                "strat": "Lubricant Spotting & Jarring",
                "mat": "Pipe-Lax spotting fluid",
                "vol": "18 m³",
                "soak": "3.5 hours",
                "sop": "OIL-SOP-DRL-038 Rev.2",
                "remarks": "Spotted 18 m3 Pipe-Lax pill, jarred upward for 3.5 hrs. String freed."
            }
        }
    ]

    for item in incidents_seed:
        f_obj = form_objects[item["form"]]
        w_obj = well_objects[item["well_id"]]
        tvd_val = item["md_start"] * 0.94
        tvdss_val = calculate_tvdss(tvd_val, w_obj.KB_elevation)
        eta_val = calculate_eta_norm(tvdss_val, f_obj.top_tvdss, f_obj.base_tvdss)

        inc = DrillingIncident(
            well_id=item["well_id"],
            formation_id=f_obj.formation_id,
            hazard_type=item["hazard"],
            depth_start=item["md_start"],
            depth_end=item["md_end"],
            depth_tvd=round(tvd_val, 1),
            depth_tvdss=round(tvdss_val, 1),
            eta_norm=eta_val,
            severity=item["severity"],
            NPT_hours=item["npt"],
            volume_loss_m3=item.get("vol_loss", 0.0),
            overpull_klbs=item.get("overpull", 0.0),
            description=item["desc"],
            source_document=item["doc"],
            page_number=item["page"],
            timestamp="2025-11-20",
            verification_status="VERIFIED"
        )
        db.add(inc)
        db.flush()

        mit_data = item["mit"]
        mit = Mitigation(
            incident_id=inc.incident_id,
            strategy=mit_data["strat"],
            material=mit_data["mat"],
            volume=mit_data["vol"],
            soaking_time=mit_data["soak"],
            success=True,
            SOP_reference=mit_data["sop"],
            operational_remarks=mit_data["remarks"],
            post_mitigation_npt_saved=round(item["npt"] * 0.75, 1)
        )
        db.add(mit)
    db.commit()

    # 6. Look-Ahead Alert for Active Well OIL-DEMO-001
    alert_1 = Alert(
        well_id=1,
        hazard_type="Lost Circulation",
        severity="CRITICAL",
        current_depth=2845.0,
        predicted_depth_start=2860.0,
        predicted_depth_end=2872.0,
        formation="Barail Arenaceous (Sandstone)",
        eta_norm_predicted=0.73,
        risk_score=0.82,
        confidence=0.91,
        evidence=[
            {
                "well_name": "OIL-DEMO-002 (NHK-388)",
                "distance_m": 650,
                "loss_volume": "45.0 m³",
                "npt_hours": "18.5 hrs",
                "eta_norm": 0.73,
                "source_doc": "WCR_OIL_NHK_388_Final.pdf (Pg 8)",
                "summary": "Total circulation loss at 2862m MD in sub-hydrostatic Barail sand."
            },
            {
                "well_name": "WELL-SYN-002 (Benchmark)",
                "distance_m": 820,
                "loss_volume": "32.0 m³",
                "npt_hours": "14.0 hrs",
                "eta_norm": 0.70,
                "source_doc": "DDR_WELL_SYN_002_Section12.25.pdf (Pg 2)",
                "summary": "Partial loss escalated to 32 m3 cumulative loss."
            }
        ],
        recommended_action="1. Pre-mix 30 m³ coarse LCM pill in reserve pit.\n2. Reduce pump flow rate from 2400 LPM to 2000 LPM before drilling into 2860 m.\n3. Closely monitor active pit level for early loss detection.\n4. Refer to SOP OIL-SOP-DRL-042 Rev.3.",
        mitigation_options=[
            {
                "strategy": "High-Permeability LCM Pill (Nut Plug + Mica + CaCO3 40 ppb)",
                "material": "Coarse Calcium Carbonate (50 mesh) + Nut Plug Blend",
                "volume": "25 m³",
                "soaking_time": "4.0 hours with low pump rate (1.5 bpm)",
                "SOP_reference": "OIL-SOP-DRL-042 Rev.3",
                "success_rate": "100% Historical Success in Nahorkatiya Offset Wells"
            }
        ],
        status="ACTIVE",
        created_at=datetime.datetime.utcnow(),
        analysis_method="4-Factor Offset Spatial-Stratigraphic Analysis",
        analysis_version="v1.4.2"
    )
    db.add(alert_1)

    # 7. Document Intelligence & Verification Records
    # Document 1: WCR_OIL_NHK_388_Final.pdf
    doc_1 = Document(
        well_id=2,
        document_title="Well Completion Report - OIL-DEMO-002 (NHK-388)",
        filename="WCR_OIL_NHK_388_Final.pdf",
        doc_type="WCR",
        file_size_bytes=4850000,
        status="VERIFIED",
        page_count=24,
        summary="Well Completion Report for OIL-AK-388. TD 3,420 m MD. Severe circulation loss at 2,862 m MD in Barail Sandstone (45 m3 lost, 18.5 hrs NPT). Healed with 25 m3 LCM pill.",
        extraction_confidence=0.96,
        uploaded_by="Data Ingestion Pipeline",
        document_version="1.0",
        document_source="Oil India Limited (OIL) Digital Archive",
        verified_by="Dr. Ananya Dutta (Geoscientist)",
        verified_at=datetime.datetime.utcnow()
    )
    db.add(doc_1)
    db.flush()

    extractions_doc1 = [
        ("WELL_METADATA", "WELL_INFO", "UWI", "IN-OIL-AS-NHK-388", 0.99, 1, "UWI: IN-OIL-AS-NHK-388 | Operator: Oil India Limited | Field: Nahorkatiya", "VERIFIED"),
        ("GEOLOGICAL_INFO", "FORMATION_TOP", "Barail Sandstone Top", "2,480.0 m MD (2,330.0 m TVDSS)", 0.95, 4, "Stratigraphic Top of Barail Sandstone logged at 2480m MD with clean blocky sand signature.", "VERIFIED"),
        ("DRILLING_EVENTS", "HAZARD_EVENT", "Circulation Loss Event", "45 m³ total loss at 2,862.0 m MD", 0.96, 8, "At 2862m MD sudden drop in standpipe pressure from 2180 psi to 1890 psi and pit level loss rate 18 m3/hr.", "VERIFIED"),
        ("DRILLING_EVENTS", "HAZARD_EVENT", "NPT Accrued", "18.5 Hours NPT", 0.98, 8, "Total NPT accrued during loss event: 18.5 hours before normal drilling resumed.", "VERIFIED"),
        ("MITIGATION", "MITIGATION", "LCM Pill Recipe", "25 m³ High-Perm LCM Pill (Nut Plug 20 ppb + Mica 15 ppb + CaCO3 10 ppb)", 0.94, 9, "Pumped 25 m3 LCM pill, squeezed 6 m3 into formation at 1.5 bpm. Soaked 4 hours. Full returns established.", "VERIFIED")
    ]
    for f_grp, e_type, e_key, e_val, e_conf, e_pg, e_snip, v_stat in extractions_doc1:
        d_ext = DocumentExtraction(
            document_id=doc_1.id,
            field_group=f_grp,
            entity_type=e_type,
            entity_key=e_key,
            entity_value=e_val,
            confidence=e_conf,
            page_number=e_pg,
            source_snippet=e_snip,
            is_verified=True,
            verification_status=v_stat,
            verified_by="Dr. Ananya Dutta (Geoscientist)"
        )
        db.add(d_ext)

    # Document 2: Synthetic Benchmark Report WELL-SYN-001
    doc_2 = Document(
        well_id=23,
        document_title="Synthetic Benchmark Report - WELL-SYN-001 Sticking Case",
        filename="WCR_WELL_SYN_001_Final.pdf",
        doc_type="WCR",
        file_size_bytes=3200000,
        status="NEEDS_REVIEW",
        page_count=16,
        summary="Synthetic Benchmark Report for WELL-SYN-001. Evaluates differential sticking response in depleted sub-hydrostatic Barail sands.",
        extraction_confidence=0.92,
        uploaded_by="Benchmark Rig Supervisor",
        document_version="1.0",
        document_source="Synthetic NWIS Benchmark Suite"
    )
    db.add(doc_2)
    db.flush()

    extractions_doc2 = [
        ("WELL_METADATA", "WELL_INFO", "Well Identifier", "WELL-SYN-001 (Benchmark)", 0.99, 1, "SYNTHETIC APPRAISAL WELL REPORT: WELL-SYN-001", "VERIFIED"),
        ("DRILLING_PARAMETERS", "DRILLING_PARAM", "Mud Weight", "1.24 S.G.", 0.91, 3, "Active Mud Weight: 1.24 S.G. KCl polymer system", "NOT_REVIEWED"),
        ("DRILLING_EVENTS", "HAZARD_EVENT", "Differential Sticking", "Stuck at 2,880.0 m MD (75 klbs Overpull)", 0.93, 4, "String differentially stuck during directional survey. Overpull peaked at 75 klbs above hookload.", "NOT_REVIEWED"),
        ("MITIGATION", "MITIGATION", "Remediation Action", "Pipe-Lax 18 m³ Pill + Jarring", 0.95, 5, "Spotted 18 m3 lubricant around BHA, jarred upward for 3.5 hours until freed.", "NOT_REVIEWED")
    ]
    for f_grp, e_type, e_key, e_val, e_conf, e_pg, e_snip, v_stat in extractions_doc2:
        d_ext = DocumentExtraction(
            document_id=doc_2.id,
            field_group=f_grp,
            entity_type=e_type,
            entity_key=e_key,
            entity_value=e_val,
            confidence=e_conf,
            page_number=e_pg,
            source_snippet=e_snip,
            is_verified=(v_stat == "VERIFIED"),
            verification_status=v_stat,
            verified_by="Dr. Ananya Dutta" if v_stat == "VERIFIED" else None
        )
        db.add(d_ext)

    # 8. Seed Audit Logs
    audit_seeds = [
        AuditLog(user_id="admin", user_name="Administrator", role="ADMIN", action="SYSTEM_INIT", entity_type="SYSTEM", entity_id="ROOT", reason="Initialized eRTMAC-NWIS platform database"),
        AuditLog(user_id="admin", user_name="Administrator", role="ADMIN", action="SEED_DEMO_DATA", entity_type="WELL", entity_id="ALL", reason="Seeded 25 wells (including 3 synthetic benchmark wells) and historical reports"),
        AuditLog(user_id="geologist", user_name="Dr. Ananya Dutta", role="GEOLOGIST", action="APPROVE_DOCUMENT", entity_type="DOCUMENT", entity_id=str(doc_1.id), reason="Approved WCR_OIL_NHK_388_Final.pdf after human verification"),
        AuditLog(user_id="driller", user_name="Er. Rajesh Sarmah", role="DRILLING_ENGINEER", action="MANUAL_DEPTH_ENTRY", entity_type="DEPTH_READING", entity_id="1", reason="Set active well OIL-DEMO-001 depth to 2,845m MD")
    ]
    for a in audit_seeds:
        db.add(a)

    db.commit()
    print("Database seeding completed successfully with synthetic benchmark wells & audit records!")
    db.close()

if __name__ == "__main__":
    seed_database()
