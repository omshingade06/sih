from fastapi import APIRouter
from app.schemas.schemas import TelemetryStreamControl
from app.services.telemetry_simulator import simulator

router = APIRouter(prefix="/telemetry", tags=["Real-Time Telemetry"])

@router.get("/{well_id}")
def get_latest_telemetry(well_id: int):
    point = simulator.generate_telemetry_point(well_id)
    return point

@router.get("/{well_id}/state")
def get_simulator_state(well_id: int):
    state = simulator.get_state(well_id)
    return state

@router.post("/{well_id}/control")
def control_telemetry_simulator(well_id: int, ctrl: TelemetryStreamControl):
    updated_state = simulator.control(
        well_id=well_id,
        action=ctrl.action,
        speed=ctrl.speed_multiplier or 1.0,
        anomaly_type=ctrl.anomaly_type
    )
    return {"status": "success", "action": ctrl.action, "state": updated_state}
