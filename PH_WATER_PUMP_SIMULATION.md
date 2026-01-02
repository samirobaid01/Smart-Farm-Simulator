# pH-Based Water Pump Simulation

## 🎯 Overview

This simulation implements a **pH-driven water pump control system** where:
- **Backend monitors pH Level** (from Sensor ID 1)
- **Rule**: If pH > 7 → Water Pump ON, If pH ≤ 7 → Water Pump OFF
- **Water Pump effect**: When ON, decreases pH by 0.1 per tick
- **Natural drift**: pH increases slightly over time (0.0 to 0.05 per tick)

## 📊 Configuration (All Data-Driven, No Hardcoding)

### Initial pH Value
**File**: `src/config/simulation.json`
```json
{
  "initialEnvironment": {
    "pH": 8.5  // Start with pH > 7 to trigger pump
  }
}
```

### Water Pump Effects
**File**: `src/models/devices/pump.json`
```json
{
  "type": "WATER_PUMP",
  "effects": {
    "soilMoisture": 2.0,
    "pH": -0.1  // Decreases pH when pump is ON
  }
}
```

### Natural pH Drift
**File**: `src/models/environment/drift.json`
```json
{
  "pH": [0.0, 0.05]  // pH increases naturally over time
}
```

### pH Sensor Configuration
**File**: `src/config/config.ts`
```typescript
{
  sensorId: 1,
  sensorName: "pH Meter - NFT System",
  TelemetryData: [
    {
      variableName: "pH Level",
      datatype: "float",
      minRange: 0,
      maxRange: 14,
    }
  ]
}
```

## 🔄 Complete Flow

```
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Initial State                                        │
└─────────────────────────────────────────────────────────────┘
    pH = 8.5 (from simulation.json)
    Water Pump = OFF
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Send pH Reading to Backend                          │
└─────────────────────────────────────────────────────────────┘
    Telemetry: { variableName: "pH Level", value: "8.50" }
    → Backend receives via HTTP/MQTT/CoAP
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Backend Rule Engine Evaluates                        │
└─────────────────────────────────────────────────────────────┘
    Rule: pH (8.50) > 7 → Turn ON Water Pump
    Backend sends: device-state-change
    {
      deviceUuid: "d290f1ee-6c54-4b01-90e6-d701748f0851",
      metadata: {
        deviceName: "Main Water Pump",
        stateName: "Pump Power",
        newValue: "on"
      }
    }
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 4: DeviceManager Updates Pump State                     │
└─────────────────────────────────────────────────────────────┘
    Water Pump status = ON
    Device created dynamically (if not exists)
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 5: Next Simulation Tick (every 5 seconds)              │
└─────────────────────────────────────────────────────────────┘
    1. EnvironmentEngine.applyDrift()
       → pH += random(0.0, 0.05)  // Natural increase
       → pH = 8.5 + 0.02 = 8.52
                    ↓
    2. DeviceEffectEngine.apply()
       → Water Pump is ON
       → pH -= 0.1  // Pump effect
       → pH = 8.52 - 0.1 = 8.42
                    ↓
    3. SensorEngine.read()
       → Returns: { pH: 8.42 }
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 6: Send New pH Reading                                  │
└─────────────────────────────────────────────────────────────┘
    Telemetry: { variableName: "pH Level", value: "8.42" }
    → Backend receives
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 7: Backend Evaluates Again                             │
└─────────────────────────────────────────────────────────────┘
    Rule: pH (8.42) > 7 → Keep Pump ON
    (No new command sent, status unchanged)
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 8: Continue Until pH ≤ 7                               │
└─────────────────────────────────────────────────────────────┘
    After ~15 ticks (75 seconds):
    - pH decreases from 8.5 to ~7.0
    - Backend: pH (7.0) ≤ 7 → Turn OFF Pump
    - Pump turns OFF
    - pH stabilizes with natural drift only
```

## 📈 Example Timeline

### T=0s: Initial State
- **pH**: 8.5 (from config)
- **Pump**: OFF
- **Action**: Send pH = 8.5 to backend

### T=5s: Backend Responds
- **Backend**: pH (8.5) > 7 → Turn ON Pump
- **Pump**: ON
- **Log**: `✅ Device updated: d290f1ee... (WATER_PUMP) → ON`

### T=10s: First Tick After Pump ON
- **Drift**: pH += 0.02 → 8.52
- **Pump Effect**: pH -= 0.1 → 8.42
- **Result**: pH = 8.42
- **Action**: Send pH = 8.42 to backend

### T=15s: Backend Keeps Pump ON
- **Backend**: pH (8.42) > 7 → Keep ON
- **No new command**

### T=20s: Second Tick
- **Drift**: pH += 0.03 → 8.45
- **Pump Effect**: pH -= 0.1 → 8.35
- **Result**: pH = 8.35
- **Action**: Send pH = 8.35 to backend

### T=75s: pH Reaches 7.0
- **pH**: 7.0 (after ~15 ticks)
- **Backend**: pH (7.0) ≤ 7 → Turn OFF Pump
- **Pump**: OFF
- **Log**: `✅ Device updated: d290f1ee... (WATER_PUMP) → OFF`

### T=80s: Pump OFF, pH Stabilizes
- **Drift**: pH += 0.01 → 7.01
- **Pump Effect**: None (pump is OFF)
- **Result**: pH = 7.01
- **Action**: Send pH = 7.01 to backend

### T=85s: Backend Keeps Pump OFF
- **Backend**: pH (7.01) > 7 → Turn ON Pump
- **Pump**: ON again
- **Cycle continues...**

## 🔍 Key Features

### ✅ Data-Driven (No Hardcoding)
- Initial pH: `simulation.json`
- Pump effects: `models/devices/pump.json`
- Natural drift: `models/environment/drift.json`
- Sensor config: `config/config.ts`

### ✅ Dynamic Device Creation
- Water pump created automatically when backend sends command
- Device type inferred from device name ("Main Water Pump" → "WATER_PUMP")
- Device UUID from backend metadata

### ✅ Realistic Simulation
- Natural pH drift (increases over time)
- Pump effect (decreases pH when ON)
- Continuous feedback loop

## 📝 Console Output Example

```
🚀 Starting closed-loop simulation...
📊 Initial environment: { temperature: '22.00', humidity: '60.00', soilMoisture: '50.00', pH: '8.50' }
📡 Sensor readings: { temperature: '22.00', humidity: '60.00', soilMoisture: '50.00', pH: '8.50' }
📤 Sent: pH Level = 8.50
📨 Received device state change: { deviceUuid: 'd290f1ee...', metadata: {...} }
🔧 Processing device command: { deviceUuid: 'd290f1ee...', ... }
📝 Creating new device dynamically: d290f1ee-6c54-4b01-90e6-d701748f0851 (WATER_PUMP)
✅ Device updated: d290f1ee-6c54-4b01-90e6-d701748f0851 (WATER_PUMP) → ON
📡 Sensor readings: { temperature: '22.00', humidity: '60.00', soilMoisture: '52.00', pH: '8.42' }
📤 Sent: pH Level = 8.42
📡 Sensor readings: { temperature: '22.00', humidity: '60.00', soilMoisture: '54.00', pH: '8.35' }
📤 Sent: pH Level = 8.35
...
📡 Sensor readings: { temperature: '22.00', humidity: '60.00', soilMoisture: '80.00', pH: '7.00' }
📤 Sent: pH Level = 7.00
📨 Received device state change: { deviceUuid: 'd290f1ee...', metadata: { newValue: 'off' } }
✅ Device updated: d290f1ee-6c54-4b01-90e6-d701748f0851 (WATER_PUMP) → OFF
```

## 🎛️ Adjusting Parameters

### Change Initial pH
Edit `src/config/simulation.json`:
```json
{
  "initialEnvironment": {
    "pH": 9.0  // Start higher to observe longer pump cycle
  }
}
```

### Change Pump Effect
Edit `src/models/devices/pump.json`:
```json
{
  "effects": {
    "pH": -0.2  // Stronger effect (pH decreases faster)
  }
}
```

### Change Natural Drift
Edit `src/models/environment/drift.json`:
```json
{
  "pH": [0.0, 0.1]  // Faster natural increase
}
```

## ✅ Verification Checklist

- [x] pH added to EnvironmentState
- [x] Initial pH from simulation.json (8.5)
- [x] Pump effect on pH (-0.1 per tick)
- [x] Natural pH drift (0.0 to 0.05)
- [x] pH sensor reading sent to backend
- [x] DeviceManager handles backend format
- [x] Dynamic device creation
- [x] All values data-driven (no hardcoding)


