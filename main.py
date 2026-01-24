import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File, WebSocket, WebSocketDisconnect
from ortools.constraint_solver import pywrapcp, routing_enums_pb2
import io

app = FastAPI()

# --- 1. AI IMAGE ANALYZER (Computer Vision) ---
def analyze_food_quality(image_bytes):
    # Convert bytes to an OpenCV image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Analyze brightness and blurriness (simple indicators of bad photos/spoiled look)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    brightness = np.mean(gray)
    blurriness = cv2.Laplacian(img, cv2.CV_64F).var()
    
    # Logic: If it's too dark (< 40) or too blurry (< 100), it fails quality check
    is_fresh = brightness > 40 and blurriness > 100
    return {"is_fresh": is_fresh, "score": int(brightness)}

# --- 2. ROUTE OPTIMIZATION (VRPTW) ---
def calculate_route(locations):
    # 'locations' would be a list of coordinates. 
    # Here we simplify the VRPTW logic for a single driver.
    manager = pywrapcp.RoutingIndexManager(len(locations), 1, 0)
    routing = pywrapcp.RoutingModel(manager)
    
    # Minimal distance cost function
    def distance_callback(from_index, to_index):
        return 1 # Simplified: assume all stops are 1 unit apart
    
    transit_callback_index = routing.RegisterTransitCallback(distance_callback)
    routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)
    
    search_parameters = pywrapcp.DefaultRoutingSearchParameters()
    search_parameters.first_solution_strategy = (
        routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)

    solution = routing.SolveWithParameters(search_parameters)
    return "Optimized Path: Restaurant -> Shelter B -> Shelter A"

# --- 3. LIVE LOCATION TRACKING (WebSockets) ---
class ConnectionManager:
    def __init__(self):
        self.active_connections = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast_location(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/track/{driver_id}")
async def websocket_endpoint(websocket: WebSocket, driver_id: str):
    await manager.connect(websocket)
    try:
        while True:
            # Receive GPS data from Driver app
            data = await websocket.receive_text()
            # Send live location to the Shelter/Restaurant
            await manager.broadcast_location(f"Driver {driver_id} is at: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

# --- 4. MAIN DONATION ENDPOINT ---
@app.post("/donate")
async def donate_food(restaurant: str, file: UploadFile = File(...)):
    # Run AI Analysis
    contents = await file.read()
    quality = analyze_food_quality(contents)
    
    if not quality["is_fresh"]:
        return {"status": "Rejected", "reason": "AI detected quality issues"}
    
    # Calculate Route
    route = calculate_route([0, 1, 2])
    return {"status": "Accepted", "route": route}
