import asyncio
import datetime
import random
import math
from typing import Dict, Any, List, Set
from fastapi import WebSocket

class TelemetrySimulator:
    def __init__(self):
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # Simulation state per well_id
        self.state: Dict[int, Dict[str, Any]] = {
            1: {
                "well_id": 1,
                "is_running": True,
                "speed": 1.0,
                "current_md": 2845.0,
                "current_tvd": 2680.0,
                "base_wob": 14.5,     # metric tonnes / klbs
                "base_rpm": 120.0,    # RPM
                "base_rop": 18.5,     # m/hr
                "base_ecd": 1.24,     # S.G.
                "base_spp": 2150.0,   # psi
                "base_torque": 16.8,  # kN.m
                "base_flow_in": 2400.0,  # LPM
                "base_flow_out": 2400.0, # LPM
                "base_mud_weight": 1.20, # S.G.
                "base_gas": 0.35,     # %
                "active_anomaly": None,
                "anomaly_ticks_remaining": 0,
                "lookahead_window": 50.0
            }
        }
        self.background_task = None

    def get_state(self, well_id: int) -> Dict[str, Any]:
        if well_id not in self.state:
            self.state[well_id] = {
                "well_id": well_id,
                "is_running": True,
                "speed": 1.0,
                "current_md": 2845.0,
                "current_tvd": 2680.0,
                "base_wob": 14.5,
                "base_rpm": 120.0,
                "base_rop": 18.5,
                "base_ecd": 1.24,
                "base_spp": 2150.0,
                "base_torque": 16.8,
                "base_flow_in": 2400.0,
                "base_flow_out": 2400.0,
                "base_mud_weight": 1.20,
                "base_gas": 0.35,
                "active_anomaly": None,
                "anomaly_ticks_remaining": 0,
                "lookahead_window": 50.0
            }
        return self.state[well_id]

    async def connect(self, websocket: WebSocket, well_id: int):
        await websocket.accept()
        if well_id not in self.active_connections:
            self.active_connections[well_id] = set()
        self.active_connections[well_id].add(websocket)

    def disconnect(self, websocket: WebSocket, well_id: int):
        if well_id in self.active_connections:
            self.active_connections[well_id].discard(websocket)

    def control(self, well_id: int, action: str, speed: float = 1.0, anomaly_type: str = None):
        state = self.get_state(well_id)
        if action == "start":
            state["is_running"] = True
        elif action == "pause":
            state["is_running"] = False
        elif action == "reset":
            state["current_md"] = 2845.0
            state["current_tvd"] = 2680.0
            state["active_anomaly"] = None
            state["anomaly_ticks_remaining"] = 0
            state["is_running"] = True
        elif action == "step":
            state["current_md"] += 1.0
            state["current_tvd"] += 0.94
        elif action == "set_speed":
            state["speed"] = max(0.2, min(5.0, speed))
        elif action == "trigger_anomaly":
            state["active_anomaly"] = anomaly_type or "Lost Circulation"
            state["anomaly_ticks_remaining"] = 20
        return state

    def generate_telemetry_point(self, well_id: int) -> Dict[str, Any]:
        state = self.get_state(well_id)
        
        # Advance depth if running
        if state["is_running"]:
            # Advancing depth: 0.15 m per tick * speed
            delta_md = 0.15 * state["speed"]
            state["current_md"] += delta_md
            state["current_tvd"] += delta_md * 0.94

        md = round(state["current_md"], 2)
        tvd = round(state["current_tvd"], 2)
        
        # Auto trigger hazard scenario when approaching target depth interval 2860 - 2872m
        if 2858.0 <= md <= 2875.0 and state["active_anomaly"] is None:
            state["active_anomaly"] = "Lost Circulation"
            state["anomaly_ticks_remaining"] = 30

        # Normal random drilling noise
        noise_wob = random.gauss(0, 0.4)
        noise_rpm = random.gauss(0, 1.2)
        noise_rop = random.gauss(0, 0.8)
        noise_spp = random.gauss(0, 15.0)
        noise_torque = random.gauss(0, 0.3)
        noise_gas = random.gauss(0, 0.02)

        wob = state["base_wob"] + noise_wob
        rpm = state["base_rpm"] + noise_rpm
        rop = state["base_rop"] + noise_rop
        ecd = state["base_ecd"] + random.gauss(0, 0.005)
        spp = state["base_spp"] + noise_spp
        torque = state["base_torque"] + noise_torque
        flow_in = state["base_flow_in"] + random.gauss(0, 10.0)
        flow_out = state["base_flow_out"] + random.gauss(0, 10.0)
        mud_weight = state["base_mud_weight"]
        gas = max(0.05, state["base_gas"] + noise_gas)
        
        is_anomaly = False
        anomaly_type = None

        # Apply active anomaly perturbation
        if state["active_anomaly"]:
            is_anomaly = True
            anomaly_type = state["active_anomaly"]
            
            if anomaly_type == "Lost Circulation":
                # SPP drops, flow_out drops drastically, ECD drops slightly
                spp -= 280.0 + random.uniform(20, 60)
                flow_out = max(1100.0, flow_out - 850.0 + random.uniform(-50, 50))
                rop += 3.5  # drilling break often precedes loss in fractured sand
                ecd -= 0.04
            elif anomaly_type == "Differential Sticking" or anomaly_type == "Mechanical Sticking":
                # Torque spikes, ROP drops, SPP increases
                torque += 6.5 + random.uniform(1.0, 3.0)
                rop = max(1.5, rop - 14.0)
                spp += 320.0
                rpm = max(40.0, rpm - 35.0)
            elif anomaly_type == "Gas Kick" or anomaly_type == "Pore Pressure / Kick":
                # Gas spikes, flow out increases, SPP drops/fluctuates
                gas += 4.8 + random.uniform(0.5, 2.0)
                flow_out += 450.0
                rop += 5.0
                ecd -= 0.06

            state["anomaly_ticks_remaining"] -= 1
            if state["anomaly_ticks_remaining"] <= 0:
                state["active_anomaly"] = None

        return {
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "well_id": well_id,
            "measured_depth": md,
            "true_vertical_depth": tvd,
            "WOB": round(max(2.0, wob), 2),
            "RPM": round(max(10.0, rpm), 1),
            "ROP": round(max(0.5, rop), 2),
            "ECD": round(max(1.0, ecd), 3),
            "SPP": round(max(500.0, spp), 1),
            "torque": round(max(2.0, torque), 2),
            "flow_in": round(max(500.0, flow_in), 1),
            "flow_out": round(max(200.0, flow_out), 1),
            "mud_weight": round(mud_weight, 2),
            "gas": round(gas, 2),
            "differential_pressure": round(spp * 0.12, 1),
            "hook_load": round(180.0 + (torque * 0.8), 1),
            "vibration_radial": round(1.2 + (0.8 if is_anomaly else 0.1), 2),
            "is_anomaly": is_anomaly,
            "anomaly_type": anomaly_type,
            "stream_source": "SIMULATED eRTMAC STREAM"
        }

    async def broadcast_loop(self):
        while True:
            try:
                for well_id, sockets in list(self.active_connections.items()):
                    if sockets:
                        point = self.generate_telemetry_point(well_id)
                        dead_sockets = set()
                        for ws in list(sockets):
                            try:
                                await ws.send_json(point)
                            except Exception:
                                dead_sockets.add(ws)
                        sockets.difference_update(dead_sockets)
            except Exception as e:
                pass
            await asyncio.sleep(1.0)

simulator = TelemetrySimulator()
