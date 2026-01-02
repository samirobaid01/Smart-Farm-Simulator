# Flow After Backend Sends Device Command

## 📡 Backend Event Received

When the backend sends a `device-state-change` event like this:

```json
{
  "title": "Device State Change: Main Water Pump",
  "message": "State 'Pump Power' changed from 'off' to 'off'",
  "type": "state_change",
  "deviceType": "actuator",
  "deviceId": 1,
  "deviceUuid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "metadata": {
    "deviceName": "Main Water Pump",
    "stateName": "Pump Power",
    "oldValue": "off",
    "newValue": "off"
  }
}
```

## 🔄 Complete Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: Socket Listener Receives Event                          │
└─────────────────────────────────────────────────────────────────┘
                    ↓
    socket.on("device-state-change", (data) => {
      console.log("📨 Received device state change:", data);
      deviceCommandHandler(data);  // Routes to simulation
    })
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: ClosedLoopSimulation.processDeviceCommand()              │
└─────────────────────────────────────────────────────────────────┘
                    ↓
    processDeviceCommand(command) {
      console.log("🔧 Processing device command:", command);
      deviceManager.updateDevice(command);  // Updates device state
    }
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: DeviceManager.updateDevice()                            │
└─────────────────────────────────────────────────────────────────┘
                    ↓
    Parses backend format:
    - deviceUuid: "d290f1ee-6c54-4b01-90e6-d701748f0851"
    - metadata.stateName: "Pump Power"
    - metadata.newValue: "off" → maps to status: "OFF"
    - metadata.deviceName: "Main Water Pump" → infers type: "WATER_PUMP"
                    ↓
    If device doesn't exist:
    - Creates device dynamically with UUID
    - Sets type based on device name
    - Sets status to "OFF"
                    ↓
    Updates device state:
    {
      deviceUuid: "d290f1ee-6c54-4b01-90e6-d701748f0851",
      type: "WATER_PUMP",
      status: "OFF",
      level: 0
    }
                    ↓
    console.log("✅ Device updated: d290f1ee... → OFF")
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: Next Simulation Tick (runs every 5 seconds)            │
└─────────────────────────────────────────────────────────────────┘
                    ↓
    ClosedLoopSimulation.runTick() {
      1. Get current device states (including updated pump)
      2. Run SimulationRunner.tick()
    }
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: SimulationRunner.tick() - Applies Effects               │
└─────────────────────────────────────────────────────────────────┘
                    ↓
    Order of operations:
    
    1. EnvironmentEngine.applyDrift()
       → Applies natural environmental changes
       → Temperature: ±0.2°C, Humidity: ±0.5%, etc.
                    ↓
    2. DeviceEffectEngine.apply(devices, env)
       → Checks if WATER_PUMP is ON
       → Since status is "OFF", no effect applied
       → If ON, would apply: soilMoisture += 2.0
                    ↓
    3. FailureEngine.inject(env)
       → 1% chance of random failure
                    ↓
    4. SensorEngine.read(env)
       → Reads current environment state
       → Returns: { temperature, humidity, soilMoisture, ... }
                    ↓
    5. CropGrowthEngine.evaluate() (if crops exist)
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Send New Sensor Readings to Backend                      │
└─────────────────────────────────────────────────────────────────┘
                    ↓
    SimulationTelemetryAdapter.sendEnvironmentReadings() {
      For each device context:
        - Maps environment to telemetry payloads
        - Sensor 3: Water Temperature → env.temperature
        - Sensor 4: DO Saturation → env.oxygenPPM
        - Sensor 5: Tank Capacity → env.soilMoisture
    }
                    ↓
    TelemetryService.sendPayload() {
      → Sends via HTTP/MQTT/CoAP to backend
      → Example: { variableName: "Water Temperature", value: "34.50" }
    }
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: Backend Analyzes New Sensor Data                        │
└─────────────────────────────────────────────────────────────────┘
                    ↓
    Backend receives:
    - Temperature: 34.50°C (still high)
    - Humidity: 60%
    - Soil Moisture: 50%
                    ↓
    Backend rule engine:
    - If temperature > 30°C → Turn ON AC
    - If soil moisture < 40% → Turn ON WATER_PUMP
    - etc.
                    ↓
    Backend sends new command:
    {
      deviceUuid: "ac-device-uuid",
      metadata: {
        deviceName: "Air Conditioner",
        stateName: "AC Power",
        newValue: "on"
      }
    }
                    ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Loop Continues                                          │
└─────────────────────────────────────────────────────────────────┘
                    ↓
    Process repeats:
    1. Receive command → Update device
    2. Next tick → Apply device effects
    3. Environment changes (temperature decreases)
    4. Send new readings → Backend
    5. Backend responds → Update devices
    6. Loop continues...
```

## 📊 Example Timeline

### T=0s: Initial State
- Temperature: 35°C
- Devices: All OFF
- **Action**: Send temperature to backend

### T=5s: Backend Responds
- **Backend sends**: `device-state-change` for AC → ON
- **DeviceManager**: Updates AC status to ON
- **Log**: `✅ Device updated: ac-1 (AC) → ON`

### T=10s: First Tick After AC ON
- **EnvironmentEngine**: Applies drift (+0.1°C)
- **DeviceEffectEngine**: AC is ON → temperature -= 0.5°C
- **Result**: Temperature = 34.6°C
- **Action**: Send 34.6°C to backend

### T=15s: Backend Analyzes
- **Backend receives**: 34.6°C (still high)
- **Backend keeps**: AC ON
- **No new command sent** (status unchanged)

### T=20s: Second Tick
- **EnvironmentEngine**: Drift (+0.05°C)
- **DeviceEffectEngine**: AC still ON → temperature -= 0.5°C
- **Result**: Temperature = 34.15°C
- **Action**: Send 34.15°C to backend

### T=100s: Temperature Reaches Target
- **Temperature**: 22°C (target reached)
- **Backend sends**: `device-state-change` for AC → OFF
- **DeviceManager**: Updates AC status to OFF
- **Next tick**: AC effect stops, temperature stabilizes

## 🔍 Key Points

1. **Device Creation**: Devices are created dynamically if they don't exist
2. **Type Inference**: Device type is inferred from device name
3. **Status Mapping**: Backend values ("on"/"off") mapped to ("ON"/"OFF")
4. **Effect Application**: Device effects only apply when status is "ON"
5. **Continuous Loop**: Process repeats every tick interval (default: 5s)

## 📝 Console Output Example

```
📨 Received device state change: { deviceUuid: 'd290f1ee...', metadata: {...} }
🔧 Processing device command: { deviceUuid: 'd290f1ee...', ... }
📝 Creating new device dynamically: d290f1ee-6c54-4b01-90e6-d701748f0851 (WATER_PUMP)
✅ Device updated: d290f1ee-6c54-4b01-90e6-d701748f0851 (WATER_PUMP) → OFF
📡 Sensor readings: { temperature: '35.00', humidity: '60.00', ... }
📤 Sent: Water Temperature = 35.00
🔌 Active devices: AC(ac-1)
```


