# Smart Farm Simulator - Implementation Plan

## 📋 Overview

This document outlines the **strictly additive, non-breaking** extension of the Smart-Farm-Simulator codebase into a scalable, data-driven smart agriculture simulation system.

## 🏗️ Architecture Overview

The system is divided into clear module boundaries:
- **Domain State**: Pure data structures (no logic)
- **Data-Driven Models**: JSON configuration files (devices, crops, environment)
- **Engines**: Open-closed business logic (environment drift, device effects, sensor reading, crop growth, failures)
- **Simulation**: Orchestration layer
- **Adapters**: Safe boundary to existing telemetry system

## 📁 Directory Structure

```
Smart-Farm-Simulator/
├── package.json                         ✅ existing (UPDATED)
├── tsconfig.json                        ✅ existing (UPDATED)
├── src/
│   ├── index.ts                         ✅ existing (NO CHANGE)
│   │
│   ├── config/                          ✅ existing
│   │   ├── config.ts
│   │   ├── crops.json
│   │   └── simulation.json              🆕 NEW
│   │
│   ├── core/                            ✅ existing (NO CHANGE)
│   │   ├── AuthService.ts
│   │   └── TelemetryService.ts
│   │
│   ├── protocols/                       ✅ existing (NO CHANGE)
│   │   ├── http.sender.ts
│   │   ├── mqtt.sender.ts
│   │   └── coap.sender.ts
│   │
│   ├── payload/                         ✅ existing (NO CHANGE)
│   │   └── payload.builder.ts
│   │
│   ├── socket/                          ✅ existing (NO CHANGE)
│   │   └── socket.listener.ts
│   │
│   ├── types.ts                         ✅ existing (NO CHANGE)
│   │
│   │====================================================
│   │ 🔽 EVERYTHING BELOW IS NEW (ADDITIVE ONLY)
│   │====================================================
│   │
│   ├── domain/                          🆕 PURE STATE
│   │   ├── EnvironmentState.ts
│   │   ├── DeviceState.ts
│   │   └── CropState.ts
│   │
│   ├── models/                          🆕 DATA-DRIVEN CONFIG
│   │   ├── devices/
│   │   │   ├── ac.json
│   │   │   ├── fan.json
│   │   │   ├── pump.json
│   │   │   ├── humidifier.json
│   │   │   ├── heater.json
│   │   │   └── growlight.json
│   │   │
│   │   ├── crops/
│   │   │   ├── tomato.json
│   │   │   └── lettuce.json
│   │   │
│   │   └── environment/
│   │       └── drift.json
│   │
│   ├── engines/                         🆕 OPEN–CLOSED ENGINES
│   │   ├── EnvironmentEngine.ts
│   │   ├── DeviceEffectEngine.ts
│   │   ├── SensorEngine.ts
│   │   ├── CropGrowthEngine.ts
│   │   └── FailureEngine.ts
│   │
│   ├── simulation/                      🆕 ORCHESTRATION
│   │   └── SimulationRunner.ts
│   │
│   └── adapters/                        🆕 SAFE BOUNDARY
│       └── TelemetryAdapter.ts
│
└── README.md                            ✅ existing
```

## 🔄 Execution Flow

### Current Flow (Unchanged)
```
index.ts
  → AuthService.login()
  → AuthService.getDeviceToken()
  → TelemetryService.execute()
    → PayloadBuilder.buildAllTelemetryPayloads()
    → ProtocolSender.send()
```

### Extended Flow (Additive)
```
index.ts (OPTIONAL - can be added later)
  → SimulationRunner.tick()
    → EnvironmentEngine.applyDrift()
    → DeviceEffectEngine.apply()
    → FailureEngine.inject()
    → SensorEngine.read()
    → CropGrowthEngine.evaluate()
    → TelemetryAdapter.sendSensorReadings()
      → TelemetryService.execute() (existing)
```

## 📊 Module Details

### 1. Domain Layer (`domain/`)

**Purpose**: Pure state representation - no business logic

- **EnvironmentState.ts**: Represents current environmental conditions
  - `temperature`, `humidity`, `soilMoisture`, `lightLux`, `oxygenPPM`

- **DeviceState.ts**: Represents device state
  - `deviceUuid`, `type` (string, not enum), `status` (ON/OFF), `level` (optional)

- **CropState.ts**: Represents crop state
  - `cropType`, `growthStage` (0→1), `healthScore` (0→100), `yieldScore` (computed)

### 2. Models Layer (`models/`)

**Purpose**: Data-driven configuration - no hardcoding

#### Device Models (`models/devices/`)
Each device JSON defines its effects on the environment:
```json
{
  "type": "AC",
  "effects": {
    "temperature": -0.5,
    "humidity": -0.1
  }
}
```

#### Crop Models (`models/crops/`)
Each crop JSON defines optimal ranges and growth parameters:
```json
{
  "name": "Tomato",
  "optimal": {
    "temperature": [20, 28],
    "humidity": [60, 80],
    "soilMoisture": [40, 60]
  },
  "growthRate": 0.01,
  "healthDecayRate": 0.1
}
```

#### Environment Models (`models/environment/`)
Defines natural drift ranges:
```json
{
  "temperature": [-0.2, 0.2],
  "humidity": [-0.5, 0.5],
  "soilMoisture": [-0.3, 0.3]
}
```

### 3. Engines Layer (`engines/`)

**Purpose**: Open-closed business logic - extensible without modification

#### EnvironmentEngine
- Applies natural environmental drift (weather effects, time-based changes)
- Uses `models/environment/drift.json` for configuration
- Clamps values to realistic ranges

#### DeviceEffectEngine
- Applies device effects to environment when devices are ON
- Dynamically loads device models from JSON files
- Unknown devices are ignored (open-closed principle)

#### SensorEngine
- Reads sensor values from current environment state
- Maps environment to sensor readings
- Handles rounding and formatting

#### CropGrowthEngine
- Evaluates crop health based on optimal environmental ranges
- Updates growth stage and health score
- Calculates yield score from growth and health

#### FailureEngine
- Injects probabilistic failures (disease, sensor faults, stress)
- Configurable failure probability
- Tests system resilience

### 4. Simulation Layer (`simulation/`)

**Purpose**: Orchestration - coordinates all engines

#### SimulationRunner
- Executes one simulation tick
- Order: Drift → Device Effects → Failures → Sensor Read → Crop Growth
- Provides callback for sensor readings and crop states
- Static factory method for initial environment

### 5. Adapters Layer (`adapters/`)

**Purpose**: Safe boundary between simulation and existing telemetry system

#### TelemetryAdapter
- Maps simulation sensor readings to telemetry payloads
- Maintains backward compatibility with existing TelemetryService
- Can be extended to match actual sensor configurations

## 🔌 Integration Points

### Backward Compatibility

**✅ Existing code remains unchanged:**
- `index.ts` - No modifications required
- `TelemetryService` - No modifications required
- `ProtocolSenders` - No modifications required
- `PayloadBuilder` - No modifications required

### Optional Integration

The simulation can be integrated optionally:

```typescript
// In index.ts (OPTIONAL - commented out by default)
import { SimulationRunner } from "./simulation/SimulationRunner.js";
import { TelemetryAdapter } from "./adapters/TelemetryAdapter.js";

// Initialize simulation
const env = SimulationRunner.createInitialEnvironment();
const devices: DeviceState[] = [/* ... */];
const crops: CropState[] = [/* ... */];
const runner = new SimulationRunner(0.01);
const adapter = new TelemetryAdapter(service, devicesContext, deviceSensorMap);

// Run simulation tick
setInterval(() => {
  runner.tick(env, devices, crops, async (sensorReadings, crops) => {
    await adapter.sendSensorReadings(sensorReadings);
  });
}, 5000);
```

## 🚀 Usage Examples

### Example 1: Basic Simulation Tick

```typescript
import { SimulationRunner } from "./simulation/SimulationRunner.js";
import { DeviceState } from "./domain/DeviceState.js";
import { CropState } from "./domain/CropState.js";

const env = SimulationRunner.createInitialEnvironment();
const devices: DeviceState[] = [
  { deviceUuid: "ac-1", type: "AC", status: "ON" },
  { deviceUuid: "pump-1", type: "WATER_PUMP", status: "ON" }
];
const crops: CropState[] = [
  { cropType: "tomato", growthStage: 0.3, healthScore: 80, yieldScore: 24 }
];

const runner = new SimulationRunner(0.01);

// Run one tick
const sensorReadings = runner.tick(env, devices, crops);
console.log("Sensor readings:", sensorReadings);
```

### Example 2: Continuous Simulation with Telemetry

```typescript
const runner = new SimulationRunner(0.01);
const adapter = new TelemetryAdapter(telemetryService, devicesContext, deviceSensorMap);

setInterval(() => {
  runner.tick(env, devices, crops, async (readings, crops) => {
    console.log("Crop health:", crops.map(c => c.healthScore));
    await adapter.sendSensorReadings(readings);
  });
}, 5000);
```

## 🔧 Configuration

### simulation.json
```json
{
  "tickIntervalMs": 5000,
  "initialEnvironment": {
    "temperature": 22,
    "humidity": 60,
    "soilMoisture": 50,
    "lightLux": 10000,
    "oxygenPPM": 21
  },
  "failureProbability": 0.01,
  "enableFailures": true,
  "enableCropSimulation": true
}
```

## 📦 Build Configuration

### package.json Updates
- Added model files to copy script: `cpx "src/models/**/*" dist/models`

### tsconfig.json Updates
- Added `resolveJsonModule: true` for JSON imports

## 🎯 Key Design Principles

1. **Additive Only**: No existing code is modified
2. **Open-Closed**: Engines can be extended via JSON files without code changes
3. **Data-Driven**: All models are JSON files, not hardcoded enums
4. **Backward Compatible**: Existing telemetry system works unchanged
5. **Separation of Concerns**: Clear boundaries between domain, models, engines, and adapters

## 🔮 Future Enhancements

1. **SQLite Support**: Replace JSON models with database queries
2. **Sensor Calibration**: Add calibration engine (open-closed design supports this)
3. **AI/ML Integration**: Use sensor readings and crop states for ML training
4. **Multi-Area Support**: Extend to support multiple farm areas
5. **Backend Command Processing**: Process device control commands from backend via sockets

## ✅ Testing Strategy

1. **Unit Tests**: Test each engine independently
2. **Integration Tests**: Test simulation runner with all engines
3. **Failure Injection**: Test resilience with failure engine
4. **Backward Compatibility**: Ensure existing telemetry still works

## 📝 Notes

- All new code is in separate directories
- Existing code paths remain untouched
- Simulation can be enabled/disabled via configuration
- Models can be extended by adding new JSON files
- Engines follow open-closed principle (extensible without modification)


