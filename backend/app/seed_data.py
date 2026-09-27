import datetime
import random
import json
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.entities import (
    User, Well, Borehole, Formation, WellFormationInterval,
    DrillingIncident, Mitigation, Telemetry, Alert,
    Document, DocumentExtraction, KnowledgeNode, KnowledgeEdge
)
from app.services.stratigraphy import calculate_tvdss, calculate_eta_norm

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if already seeded
    if db.query(Well).count() >= 20:
        print("Database already seeded with 20+ wells. Skipping.")
        db.close()
        return

    print("Seeding eRTMAC-NWIS database with Oil India Limited (Upper Assam Basin) demo data...")

    # 1. Users
    users_data = [
        {"username": "admin", "email": "admin@oilindia.in", "full_name": "Chief Drilling Engineer (Admin)", "role": "ADMIN", "pwd": "admin"},
        {"username": "driller", "email": "drilling.eng@oilindia.in", "full_name": "Er. Rajesh Sarmah (RTDC Engineer)", "role": "DRILLING_ENGINEER", "pwd": "oil123"},
        {"username": "geologist", "email": "geology.ops@oilindia.in", "full_name": "Dr. Ananya Dutta (Geoscientist)", "role": "GEOLOGIST", "pwd": "oil123"},
        {"username": "viewer", "email": "viewer@oilindia.in", "full_name": "Operations Stakeholder", "role": "VIEWER", "pwd": "oil123"}
    ]
    for u in users_data:
        if not db.query(User).filter(User.username == u["username"]).first():
            user = User(
                username=u["username"],
                email=u["email"],
                full_name=u["full_name"],
                role=u["role"],
                hashed_password=get_password_hash(u["pwd"]),
                is_active=True
            )
            db.add(user)

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

    # 3. Wells (22 realistic Oil India Limited Wells in Upper Assam Basin)
    # Centers around Nahorkatiya field: Lat 27.3000, Lon 95.3400
    wells_data = [
        # Active Well
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
        # Dikom Field Offsets
        {"id": 9, "uwi": "IN-OIL-AS-DKM-024", "name": "OIL-DEMO-009 (DKM-024)", "field": "Dikom", "lat": 27.4200, "lon": 95.1200, "td_md": 3650.0, "td_tvd": 3410.0, "kb": 118.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3650.0, "cur_tvd": 3410.0, "rig": "OIL-RIG-17"},
        {"id": 10, "uwi": "IN-OIL-AS-DKM-031", "name": "OIL-DEMO-010 (DKM-031)", "field": "Dikom", "lat": 27.4280, "lon": 95.1290, "td_md": 3710.0, "td_tvd": 3460.0, "kb": 119.5, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3710.0, "cur_tvd": 3460.0, "rig": "OIL-RIG-12"},
        # Jorajan Field Offsets
        {"id": 11, "uwi": "IN-OIL-AS-JRJ-065", "name": "OIL-DEMO-011 (JRJ-065)", "field": "Jorajan", "lat": 27.3500, "lon": 95.4800, "td_md": 4250.0, "td_tvd": 3980.0, "kb": 125.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "HORIZONTAL", "mud": "WBM KCl Glycol", "cur_md": 4250.0, "cur_tvd": 3980.0, "rig": "OIL-RIG-03"},
        {"id": 12, "uwi": "IN-OIL-AS-JRJ-072", "name": "OIL-DEMO-012 (JRJ-072)", "field": "Jorajan", "lat": 27.3580, "lon": 95.4910, "td_md": 4310.0, "td_tvd": 4020.0, "kb": 126.5, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Glycol", "cur_md": 4310.0, "cur_tvd": 4020.0, "rig": "OIL-RIG-05"},
        # Kusijan Field Offsets
        {"id": 13, "uwi": "IN-OIL-AS-KSJ-015", "name": "OIL-DEMO-013 (KSJ-015)", "field": "Kusijan", "lat": 27.4800, "lon": 95.5400, "td_md": 4120.0, "td_tvd": 3890.0, "kb": 132.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 4120.0, "cur_tvd": 3890.0, "rig": "OIL-RIG-16"},
        {"id": 14, "uwi": "IN-OIL-AS-KSJ-021", "name": "OIL-DEMO-014 (KSJ-021)", "field": "Kusijan", "lat": 27.4890, "lon": 95.5510, "td_md": 4050.0, "td_tvd": 3820.0, "kb": 133.5, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 4050.0, "cur_tvd": 3820.0, "rig": "OIL-RIG-14"},
        # Digboi Historic & Deep Offsets
        {"id": 15, "uwi": "IN-OIL-AS-DGB-210", "name": "OIL-DEMO-015 (DGB-210)", "field": "Digboi", "lat": 27.3800, "lon": 95.6200, "td_md": 2800.0, "td_tvd": 2650.0, "kb": 145.0, "status": "COMPLETED", "type": "WORKOVER", "traj": "VERTICAL", "mud": "WBM Bentonite", "cur_md": 2800.0, "cur_tvd": 2650.0, "rig": "OIL-RIG-02"},
        {"id": 16, "uwi": "IN-OIL-AS-DGB-218", "name": "OIL-DEMO-016 (DGB-218)", "field": "Digboi", "lat": 27.3890, "lon": 95.6310, "td_md": 3100.0, "td_tvd": 2920.0, "kb": 148.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3100.0, "cur_tvd": 2920.0, "rig": "OIL-RIG-07"},
        # Shalmari Field Offsets
        {"id": 17, "uwi": "IN-OIL-AS-SHL-008", "name": "OIL-DEMO-017 (SHL-008)", "field": "Shalmari", "lat": 27.2400, "lon": 95.2200, "td_md": 3880.0, "td_tvd": 3620.0, "kb": 115.0, "status": "COMPLETED", "type": "EXPLORATION", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3880.0, "cur_tvd": 3620.0, "rig": "OIL-RIG-20"},
        {"id": 18, "uwi": "IN-OIL-AS-SHL-014", "name": "OIL-DEMO-018 (SHL-014)", "field": "Shalmari", "lat": 27.2490, "lon": 95.2310, "td_md": 3950.0, "td_tvd": 3690.0, "kb": 116.2, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3950.0, "cur_tvd": 3690.0, "rig": "OIL-RIG-18"},
        # Hapjan & Kumchai Frontier Offsets
        {"id": 19, "uwi": "IN-OIL-AS-HPJ-044", "name": "OIL-DEMO-019 (HPJ-044)", "field": "Hapjan", "lat": 27.4600, "lon": 95.3800, "td_md": 4450.0, "td_tvd": 4180.0, "kb": 128.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM High-Inhibitive", "cur_md": 4450.0, "cur_tvd": 4180.0, "rig": "OIL-RIG-21"},
        {"id": 20, "uwi": "IN-OIL-AS-KMC-002", "name": "OIL-DEMO-020 (KMC-002)", "field": "Kumchai", "lat": 27.5200, "lon": 95.8500, "td_md": 4850.0, "td_tvd": 4520.0, "kb": 165.0, "status": "COMPLETED", "type": "EXPLORATION", "traj": "DIRECTIONAL", "mud": "OBM Synthetic", "cur_md": 4850.0, "cur_tvd": 4520.0, "rig": "OIL-RIG-25"},
        {"id": 21, "uwi": "IN-OIL-AS-BBL-005", "name": "OIL-DEMO-021 (BBL-005)", "field": "Borbil", "lat": 27.3200, "lon": 95.3900, "td_md": 3520.0, "td_tvd": 3290.0, "kb": 116.0, "status": "COMPLETED", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 3520.0, "cur_tvd": 3290.0, "rig": "OIL-RIG-10"},
        {"id": 22, "uwi": "IN-OIL-AS-NHK-420", "name": "OIL-DEMO-022 (NHK-420)", "field": "Nahorkatiya", "lat": 27.3090, "lon": 95.3350, "td_md": 3620.0, "td_tvd": 3390.0, "kb": 113.5, "status": "DRILLING", "type": "DEVELOPMENT", "traj": "DIRECTIONAL", "mud": "WBM KCl Polymer", "cur_md": 1950.0, "cur_tvd": 1820.0, "rig": "OIL-RIG-04"}
    ]

    well_objects = {}
    for w in wells_data:
        well = Well(
            well_id=w["id"],
            UWI=w["uwi"],
            well_name=w["name"],
            field_name=w["field"],
            basin="Upper Assam Basin",
            operator="Oil India Limited (OIL)",
            latitude=w["lat"],
            longitude=w["lon"],
            total_depth_md=w["td_md"],
            total_depth_tvd=w["td_tvd"],
            KB_elevation=w["kb"],
            spud_date="2025-11-15" if w["id"] == 1 else "2024-03-10",
            rig_id=w["rig"],
            status=w["status"],
            well_type=w["type"],
            trajectory_type=w["traj"],
            mud_system=w["mud"],
            current_bit_depth_md=w["cur_md"],
            current_bit_depth_tvd=w["cur_tvd"],
            casing_program=[
                {"size": "20\"", "shoe_md": 150.0, "weight": "94 lb/ft", "grade": "K-55"},
                {"size": "13-3/8\"", "shoe_md": 1200.0, "weight": "68 lb/ft", "grade": "L-80"},
                {"size": "9-5/8\"", "shoe_md": 2500.0, "weight": "47 lb/ft", "grade": "P-110"},
                {"size": "7\" Liner", "shoe_md": 3550.0, "weight": "29 lb/ft", "grade": "Q-125"}
            ]
        )
        db.add(well)
        well_objects[w["id"]] = well

    db.commit()

    # 4. Boreholes and Directional Trajectories
    for w_id, w_obj in well_objects.items():
        traj_points = []
        cur_md = 0.0
        cur_tvd = 0.0
        cur_inc = 0.0
        cur_azim = 45.0 + (w_id * 15.0)
        cur_east = 0.0
        cur_north = 0.0
        
        while cur_md <= w_obj.total_depth_md:
            if cur_md > 800.0 and cur_inc < 32.0:
                cur_inc += 3.0  # Build section
            delta_md = 100.0
            cur_md += delta_md
            rad_inc = (cur_inc * 3.14159) / 180.0
            rad_az = (cur_azim * 3.14159) / 180.0
            cur_tvd += delta_md * (0.95 if cur_inc > 10 else 1.0)
            cur_east += delta_md * 0.15 * (1 if w_id % 2 == 0 else -1)
            cur_north += delta_md * 0.18
            
            traj_points.append({
                "md": round(cur_md, 1),
                "tvd": round(cur_tvd, 1),
                "inclination": round(cur_inc, 1),
                "azimuth": round(cur_azim, 1),
                "easting": round(cur_east, 1),
                "northing": round(cur_north, 1)
            })

        borehole = Borehole(
            well_id=w_id,
            hole_size=8.5,
            section_name="Production Hole (8-1/2\")",
            max_inclination=32.0 if w_obj.trajectory_type != "VERTICAL" else 1.2,
            total_depth=w_obj.total_depth_md,
            trajectory=traj_points
        )
        db.add(borehole)

    # 5. Well Formation Intervals
    formation_layers = [
        ("Alluvium", 0.0, 380.0),
        ("Dhekiajuli Formation", 380.0, 1020.0),
        ("Girujan Clay", 1020.0, 1780.0),
        ("Tipam Sandstone", 1780.0, 2480.0),
        ("Surma Group", 2480.0, 2680.0),
        ("Barail Arenaceous (Sandstone)", 2680.0, 3120.0),
        ("Barail Argillaceous (Coal-Shale)", 3120.0, 3380.0),
        ("Kopili Shale", 3380.0, 3750.0),
        ("Sylhet Limestone", 3750.0, 4150.0),
        ("Precambrian Basement", 4150.0, 4500.0)
    ]

    for w_id, w_obj in well_objects.items():
        kb = w_obj.KB_elevation
        # Slightly vary depths across wells to reflect realistic basin dip (20-60m variation)
        dip_offset = (w_id % 5) * 15.0 - 30.0
        
        for form_name, base_top_md, base_bot_md in formation_layers:
            top_md = max(0.0, base_top_md + dip_offset)
            base_md = base_bot_md + dip_offset
            if top_md > w_obj.total_depth_md:
                continue
            base_md = min(w_obj.total_depth_md, base_md)
            top_tvd = top_md * 0.94
            base_tvd = base_md * 0.94
            top_tvdss = calculate_tvdss(top_tvd, kb)
            base_tvdss = calculate_tvdss(base_tvd, kb)
            
            form_obj = form_objects.get(form_name)
            if form_obj:
                interval = WellFormationInterval(
                    well_id=w_id,
                    formation_id=form_obj.formation_id,
                    top_md=round(top_md, 1),
                    base_md=round(base_md, 1),
                    top_tvd=round(top_tvd, 1),
                    base_tvd=round(base_tvd, 1),
                    top_tvdss=round(top_tvdss, 1),
                    base_tvdss=round(base_tvdss, 1)
                )
                db.add(interval)

    db.commit()

    # 6. Drilling Incidents & Mitigations (38 realistic historical events)
    incidents_catalog = [
        # Nearest Offset OIL-DEMO-002 (Crucial demo evidence)
        {
            "well_id": 2, "form": "Barail Arenaceous (Sandstone)", "hazard": "Lost Circulation",
            "md_start": 2862.0, "md_end": 2874.0, "severity": "CRITICAL", "npt": 18.5,
            "loss_m3": 45.0, "desc": "Severe total lost circulation encountered while drilling 8-1/2 section at 2862m MD into sub-hydrostatic depleted Barail reservoir sand. Standpipe pressure dropped from 2180 to 1890 psi with zero surface mud returns.",
            "doc": "WCR-OIL-DEMO-002.pdf", "page": 8, "eta": 0.73,
            "mit": {"strat": "High-Permeability LCM Pill (Nut Plug + Mica + coarse CaCO3 40 ppb)", "mat": "Coarse Nut Plug 20 ppb, Mica 15 ppb, CaCO3 10 ppb in XC Polymer slurry", "vol": "25 m³", "soak": "4.0 hours", "sop": "OIL-SOP-DRL-042 Rev.3", "remarks": "Pumped 25 m3 pill, squeezed 6 m3 into formation at 1.5 bpm. Wellbore healed completely."}
        },
        # Offset OIL-DEMO-003
        {
            "well_id": 3, "form": "Barail Arenaceous (Sandstone)", "hazard": "Lost Circulation",
            "md_start": 2855.0, "md_end": 2868.0, "severity": "HIGH", "npt": 14.0,
            "loss_m3": 38.0, "desc": "Partial losses (12 m3/hr) escalated to 38 m3 total mud loss upon penetrating fractured Barail sandstone.",
            "doc": "WCR-OIL-DEMO-003.pdf", "page": 11, "eta": 0.70,
            "mit": {"strat": "Medium LCM Pill + Flow Reduction", "mat": "Nut Plug (Coarse & Fine) 30 ppb + Quick-Seal", "vol": "20 m³", "soak": "3.5 hours", "sop": "OIL-SOP-DRL-042 Rev.3", "remarks": "Flow rate reduced to 2000 LPM. Pill spotted across loss zone. Normal returns regained."}
        },
        # Offset OIL-DEMO-004
        {
            "well_id": 4, "form": "Barail Arenaceous (Sandstone)", "hazard": "Differential Sticking",
            "md_start": 2880.0, "md_end": 2885.0, "severity": "HIGH", "npt": 22.0,
            "loss_m3": 0.0, "desc": "Drill string differentially stuck during 15-minute connection across permeable Barail sand with 350 psi overbalance. Overpull exceeded 75 klbs.",
            "doc": "DDR-OIL-DEMO-004-DAY32.pdf", "page": 2, "eta": 0.78,
            "mit": {"strat": "Pipe-Freeing Lubricant Pill (Pipe-Lax 8% in base oil) + Upward Jarring", "mat": "Pipe-Lax concentrated surfactant blend in diesel/synthetic base", "vol": "18 m³", "soak": "2.5 hours", "sop": "OIL-SOP-DRL-019", "remarks": "Spotted 18 m3 lubricant around BHA, applied 65 klbs upward jar impacts. Drill string freed on 14th stroke."}
        },
        # Offset OIL-DEMO-005
        {
            "well_id": 5, "form": "Barail Arenaceous (Sandstone)", "hazard": "Lost Circulation",
            "md_start": 2870.0, "md_end": 2882.0, "severity": "HIGH", "npt": 16.0,
            "loss_m3": 42.0, "desc": "Seepage losses of 6 m3/hr rapidly escalated to total loss at 2870m MD in porous Barail sand member.",
            "doc": "WCR-OIL-DEMO-005.pdf", "page": 9, "eta": 0.74,
            "mit": {"strat": "Engineered Fibrous LCM Pill (Cellulose fibers + CaCO3 blend)", "mat": "Cell-o-seal 15 ppb + CaCO3 25 ppb", "vol": "22 m³", "soak": "4.0 hours", "sop": "OIL-SOP-DRL-042 Rev.3", "remarks": "Full mud returns re-established. Mud weight trimmed from 1.24 to 1.20 SG."}
        },
        # Offset OIL-DEMO-006 (Moran)
        {
            "well_id": 6, "form": "Kopili Shale", "hazard": "Gas Kick",
            "md_start": 3420.0, "md_end": 3435.0, "severity": "CRITICAL", "npt": 28.5,
            "loss_m3": 0.0, "desc": "Gas influx of 18 bbl pit gain observed while drilling overpressured Kopili shale. Total gas increased from 0.8% to 11.4%. SICP reached 420 psi.",
            "doc": "WCR-OIL-DEMO-006.pdf", "page": 14, "eta": 0.82,
            "mit": {"strat": "Driller's Method Well Kill + Mud Weight Elevation to 1.32 S.G.", "mat": "Barite weighted KCl Polymer brine (1.32 SG)", "vol": "120 m³", "soak": "Circulation via Choke", "sop": "OIL-SOP-WELLCONTROL-001 Rev.4", "remarks": "Shut-in well on annular BOP, circulated out gas bubble using Driller's method. Well killed safely."}
        },
        # Offset OIL-DEMO-007 (Moran)
        {
            "well_id": 7, "form": "Girujan Clay", "hazard": "Tight Hole",
            "md_start": 1450.0, "md_end": 1490.0, "severity": "MODERATE", "npt": 9.5,
            "loss_m3": 0.0, "desc": "Severe tight hole and high drag (50 klbs overpull) due to reactive swelling Girujan clay during wiper trip.",
            "doc": "DDR-OIL-DEMO-007.pdf", "page": 3, "eta": 0.65,
            "mit": {"strat": "Glycol Inhibition Pill + Controlled Back-Reaming", "mat": "Polyalkylene Glycol (PAG) 5% inhibitor", "vol": "15 m³", "soak": "1.5 hours", "sop": "OIL-SOP-DRL-027", "remarks": "Conditioned mud with 4% potassium chloride and 3% glycol. Reamed tight interval cleanly."}
        },
        # Offset OIL-DEMO-009 (Dikom)
        {
            "well_id": 9, "form": "Barail Argillaceous (Coal-Shale)", "hazard": "Packing Off",
            "md_start": 3190.0, "md_end": 3210.0, "severity": "HIGH", "npt": 15.0,
            "loss_m3": 0.0, "desc": "Massive sloughing coal cavings packed off the annulus around stabilizers. Standpipe pressure spiked to 3200 psi.",
            "doc": "WCR-OIL-DEMO-009.pdf", "page": 7, "eta": 0.35,
            "mit": {"strat": "High-Viscosity Sweep (Tandem Low-Vis / High-Vis) + Flow Rate Surge", "mat": "Xanthan Gum high-vis pill (90 sec Marsh Funnel)", "vol": "20 m³", "soak": "N/A - Sweep", "sop": "OIL-SOP-DRL-033", "remarks": "Circulated tandem pills, cleared coal cavings from annulus. SPP restored to 2100 psi."}
        },
        # Offset OIL-DEMO-011 (Jorajan)
        {
            "well_id": 11, "form": "Barail Arenaceous (Sandstone)", "hazard": "Torque Spike",
            "md_start": 2910.0, "md_end": 2930.0, "severity": "MODERATE", "npt": 6.0,
            "loss_m3": 0.0, "desc": "Erratic top-drive torque oscillations (14 kNm to 28 kNm) in horizontal build section.",
            "doc": "DDR-OIL-DEMO-011.pdf", "page": 5, "eta": 0.85,
            "mit": {"strat": "Liquid Lubricant Addition + RPM Optimization", "mat": "Torque-Lube extreme pressure ester lubricant (2.5% vol)", "vol": "Continuous", "soak": "Continuous", "sop": "OIL-SOP-DRL-015", "remarks": "Torque stabilized at 16.5 kNm. Rotary drilling resumed smoothly."}
        },
        # Offset OIL-DEMO-013 (Kusijan)
        {
            "well_id": 13, "form": "Sylhet Limestone", "hazard": "Lost Circulation",
            "md_start": 3820.0, "md_end": 3845.0, "severity": "CRITICAL", "npt": 34.0,
            "loss_m3": 85.0, "desc": "Massive total losses into karstic cavernous vugs in Sylhet Limestone. 85 m3 lost within 20 minutes.",
            "doc": "WCR-OIL-DEMO-013.pdf", "page": 16, "eta": 0.45,
            "mit": {"strat": "Thixotropic Cement Plug Squeeze (Class G + Silica + Accelerator)", "mat": "Class G cement with 2% CaCl2 and cross-linked polymer gelling agent", "vol": "12 m³ slurry", "soak": "8.0 hours WOC", "sop": "OIL-SOP-CEMENT-008", "remarks": "Spotted thixotropic cement plug. Tagged hard cement top at 3810m MD. Pressure tested to 500 psi."}
        },
        # Offset OIL-DEMO-017 (Shalmari)
        {
            "well_id": 17, "form": "Tipam Sandstone", "hazard": "Mechanical Sticking",
            "md_start": 2150.0, "md_end": 2165.0, "severity": "HIGH", "npt": 19.0,
            "loss_m3": 0.0, "desc": "BHA key-seated in severe dogleg (4.8 deg/30m) while pulling out with 12-1/4 bit.",
            "doc": "WCR-OIL-DEMO-017.pdf", "page": 6, "eta": 0.72,
            "mit": {"strat": "Downward Jarring + Free Point Indicator & String Shot", "mat": "Hydraulic Drilling Jars (8\" Bowen)", "vol": "N/A", "soak": "1.5 hours", "sop": "OIL-SOP-DRL-021", "remarks": "Delivered 12 downward jar blows at 80 klbs. String freed without backing off."}
        }
    ]

    # Populate all 22 wells with realistic incident variations
    hazards_pool = ["Lost Circulation", "Differential Sticking", "Mechanical Sticking", "Gas Kick", "Tight Hole", "Torque Spike", "Packing Off"]
    
    for item in incidents_catalog:
        w_id = item["well_id"]
        form_name = item["form"]
        form_obj = form_objects.get(form_name, form_objects["Barail Arenaceous (Sandstone)"])
        w_obj = well_objects.get(w_id)
        kb = w_obj.KB_elevation if w_obj else 112.5
        
        tvd = item["md_start"] * 0.94
        tvdss = calculate_tvdss(tvd, kb)
        
        inc = DrillingIncident(
            well_id=w_id,
            formation_id=form_obj.formation_id,
            hazard_type=item["hazard"],
            depth_start=item["md_start"],
            depth_end=item["md_end"],
            depth_tvd=round(tvd, 1),
            depth_tvdss=round(tvdss, 1),
            eta_norm=item["eta"],
            severity=item["severity"],
            NPT_hours=item["npt"],
            volume_loss_m3=item.get("loss_m3", 0.0),
            influx_volume_bbl=18.0 if item["hazard"] == "Gas Kick" else 0.0,
            overpull_klbs=75.0 if "Sticking" in item["hazard"] else (50.0 if item["hazard"] == "Tight Hole" else 0.0),
            description=item["desc"],
            source_document=item["doc"],
            page_number=item["page"],
            timestamp="2024-04-12"
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

    # Add 25 more diverse incidents across remaining wells for comprehensive analytics
    for extra_w_id in range(8, 23):
        h_type = random.choice(hazards_pool)
        f_name = random.choice(["Tipam Sandstone", "Barail Arenaceous (Sandstone)", "Girujan Clay", "Kopili Shale"])
        f_obj = form_objects[f_name]
        md_st = random.uniform(f_obj.top_tvdss + 120.0, f_obj.base_tvdss + 80.0)
        npt_val = round(random.uniform(4.0, 24.0), 1)
        
        inc = DrillingIncident(
            well_id=extra_w_id,
            formation_id=f_obj.formation_id,
            hazard_type=h_type,
            depth_start=round(md_st, 1),
            depth_end=round(md_st + random.uniform(8.0, 25.0), 1),
            depth_tvd=round(md_st * 0.94, 1),
            depth_tvdss=round(md_st * 0.94 - 115.0, 1),
            eta_norm=round(random.uniform(0.15, 0.85), 3),
            severity=random.choice(["MODERATE", "HIGH", "CRITICAL"]),
            NPT_hours=npt_val,
            volume_loss_m3=round(random.uniform(15.0, 45.0), 1) if h_type == "Lost Circulation" else 0.0,
            overpull_klbs=round(random.uniform(30.0, 80.0), 1) if "Sticking" in h_type or "Tight" in h_type else 0.0,
            description=f"Field incident: {h_type} occurred during operations in {f_name}.",
            source_document=f"WCR-OIL-DEMO-{extra_w_id:03d}.pdf",
            page_number=random.randint(4, 18),
            timestamp="2024-08-15"
        )
        db.add(inc)
        db.flush()

        mit = Mitigation(
            incident_id=inc.incident_id,
            strategy=f"Field Remediation Strategy for {h_type} (SOP-DRL-0{random.randint(10, 49)})",
            material="Engineered additive / LCM / Glycol pill blend",
            volume=f"{random.randint(15, 30)} m³",
            soaking_time=f"{random.uniform(2.0, 5.0):.1f} hours",
            success=True,
            SOP_reference=f"OIL-SOP-DRL-0{random.randint(10, 49)} Rev.2",
            operational_remarks=f"Applied standard remediation protocol. Incident resolved with {round(npt_val*0.6, 1)} hrs saved."
        )
        db.add(mit)

    db.commit()

    # 7. Pre-seed Active Alerts for OIL-DEMO-001
    active_alert = Alert(
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
                "source_doc": "WCR-OIL-DEMO-002.pdf (Pg 8)",
                "summary": "Total circulation loss at 2862m MD in sub-hydrostatic Barail sand."
            },
            {
                "well_name": "OIL-DEMO-003 (NHK-395)",
                "distance_m": 1100,
                "loss_volume": "38.0 m³",
                "npt_hours": "14.0 hrs",
                "eta_norm": 0.70,
                "source_doc": "WCR-OIL-DEMO-003.pdf (Pg 11)",
                "summary": "Partial loss escalated to 38 m3 total loss at 2855m MD."
            },
            {
                "well_name": "OIL-DEMO-005 (NHK-375)",
                "distance_m": 1850,
                "loss_volume": "42.0 m³",
                "npt_hours": "16.0 hrs",
                "eta_norm": 0.74,
                "source_doc": "WCR-OIL-DEMO-005.pdf (Pg 9)",
                "summary": "Fractured permeable sand loss at 2870m MD."
            }
        ],
        recommended_action="1. Pre-mix 30 m³ coarse LCM pill (Nut Plug 20 ppb + Mica 15 ppb + coarse CaCO3 10 ppb) in reserve pit.\n2. Reduce pump flow rate from 2400 LPM to 2000 LPM before drilling into 2860 m.\n3. Closely monitor return flow sensor and active pit level for early loss detection.\n4. Refer to SOP OIL-SOP-DRL-042 Rev.3.",
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
        created_at=datetime.datetime.utcnow()
    )
    db.add(active_alert)

    # 8. Document Intelligence Seed Data
    doc_1 = Document(
        well_id=2,
        filename="WCR_OIL_NHK_388_Final.pdf",
        doc_type="WCR",
        file_size_bytes=4850000,
        status="PROCESSED",
        page_count=24,
        summary="Well Completion Report for OIL-AK-388. TD 3,420 m MD. Severe circulation loss at 2,862 m MD in Barail Sandstone (45 m3 lost, 18.5 hrs NPT). Healed with 25 m3 LCM pill.",
        extraction_confidence=0.96
    )
    db.add(doc_1)
    db.flush()

    extractions_doc1 = [
        {"type": "WELL_INFO", "key": "UWI", "val": "IN-OIL-AS-NHK-388", "conf": 0.99, "pg": 1, "snip": "UWI: IN-OIL-AS-NHK-388 | Operator: Oil India Limited | Field: Nahorkatiya"},
        {"type": "FORMATION_TOP", "key": "Barail Sandstone Top", "val": "2,480.0 m MD (2,330.0 m TVDSS)", "conf": 0.95, "pg": 4, "snip": "Stratigraphic Top of Barail Sandstone logged at 2480m MD with clean blocky sand signature."},
        {"type": "HAZARD_EVENT", "key": "Circulation Loss Event", "val": "45 m³ total loss at 2,862.0 m MD", "conf": 0.96, "pg": 8, "snip": "At 2862m MD sudden drop in standpipe pressure from 2180 psi to 1890 psi and pit level loss rate 18 m3/hr."},
        {"type": "HAZARD_EVENT", "key": "NPT Accrued", "val": "18.5 Hours NPT", "conf": 0.98, "pg": 8, "snip": "Total NPT accrued during loss event: 18.5 hours before normal drilling resumed."},
        {"type": "MITIGATION", "key": "LCM Pill Recipe", "val": "25 m³ High-Perm LCM Pill (Nut Plug 20 ppb + Mica 15 ppb + CaCO3 10 ppb)", "conf": 0.94, "pg": 9, "snip": "Pumped 25 m3 LCM pill, squeezed 6 m3 into formation at 1.5 bpm. Soaked 4 hours. Full returns established."}
    ]
    for ext in extractions_doc1:
        d_ext = DocumentExtraction(
            document_id=doc_1.id,
            entity_type=ext["type"],
            entity_key=ext["key"],
            entity_value=ext["val"],
            confidence=ext["conf"],
            page_number=ext["pg"],
            source_snippet=ext["snip"],
            is_verified=True,
            verified_by="Er. Rajesh Sarmah (RTDC Lead)"
        )
        db.add(d_ext)

    doc_2 = Document(
        well_id=4,
        filename="DDR_OIL_NHK_402_Section8.5.pdf",
        doc_type="DDR",
        file_size_bytes=1280000,
        status="PROCESSED",
        page_count=6,
        summary="Daily Drilling Report for OIL-AK-402 (NHK-402). 8-1/2 section. Stuck pipe at 2,880 m MD in Barail. 22 hrs NPT. Freed with Pipe-Lax pill.",
        extraction_confidence=0.94
    )
    db.add(doc_2)
    db.flush()

    extractions_doc2 = [
        {"type": "WELL_INFO", "key": "Well Identifier", "val": "OIL-AK-402 (NHK-402)", "conf": 0.99, "pg": 1, "snip": "DAILY DRILLING REPORT - RIG OIL-19 | WELL: OIL-AK-402"},
        {"type": "HAZARD_EVENT", "key": "Differential Sticking", "val": "String stuck at 2,880 m MD (75 klbs overpull)", "conf": 0.93, "pg": 2, "snip": "Drill string differentially stuck across permeable Barail sand during connection. Overpull 75 klbs."},
        {"type": "MITIGATION", "key": "Lubricant Spotting", "val": "18 m³ Pipe-Lax pill + Upward Jarring", "conf": 0.95, "pg": 3, "snip": "Spotted 18 m3 lubricant around BHA, jarred upward. String freed on 14th stroke."}
    ]
    for ext in extractions_doc2:
        d_ext = DocumentExtraction(
            document_id=doc_2.id,
            entity_type=ext["type"],
            entity_key=ext["key"],
            entity_value=ext["val"],
            confidence=ext["conf"],
            page_number=ext["pg"],
            source_snippet=ext["snip"],
            is_verified=True,
            verified_by="Dr. Ananya Dutta (Geologist)"
        )
        db.add(d_ext)

    db.commit()
    print("Database seeding completed successfully!")
    db.close()

if __name__ == "__main__":
    seed_database()
