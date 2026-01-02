# Smart Farm Simulator - Complete Structure

## 📁 Complete File Tree

```
Smart-Farm-Simulator/
├── package.json                         ✅ (UPDATED: added model copy)
├── tsconfig.json                        ✅ (UPDATED: added resolveJsonModule)
├── IMPLEMENTATION_PLAN.md               🆕 Implementation details
├── STRUCTURE.md                         🆕 This file
│
└── src/
    ├── index.ts                         ✅ EXISTING (NO CHANGE)
    │
    ├── config/                          ✅ EXISTING
    │   ├── config.ts
    │   ├── crops.json
    │   └── simulation.json              🆕 NEW
    │
    ├── core/                            ✅ EXISTING (NO CHANGE)
    │   ├── AuthService.ts
    │   ├── Crop.ts
    │   ├── CropLoader.ts
    │   ├── DeviceState.ts
    │   ├── Environment.ts
    │   ├── ExecutionMode.ts
    │   ├── Sensors.ts
    │   ├── SimulationRunner.ts          (old - can coexist)
    │   ├── TelemetrySender.ts
    │   ├── TelemetryService.ts
    │   └── Weather.ts
    │
    ├── protocols/                       ✅ EXISTING (NO CHANGE)
    │   ├── http.sender.ts
    │   ├── mqtt.sender.ts
    │   └── coap.sender.ts
    │
    ├── payload/                         ✅ EXISTING (NO CHANGE)
    │   └── payload.builder.ts
    │
    ├── socket/                          ✅ EXISTING (NO CHANGE)
    │   └── socket.listener.ts
    │
    ├── types.ts                         ✅ EXISTING (NO CHANGE)
    │
    ├── utils/                           ✅ EXISTING (NO CHANGE)
    │   └── delay.ts
    │
    │====================================================
    │ 🔽 NEW MODULES (ADDITIVE ONLY)
    │====================================================
    │
    ├── domain/                          🆕 PURE STATE
    │   ├── EnvironmentState.ts          ✅ Created
    │   ├── DeviceState.ts               ✅ Created
    │   └── CropState.ts                 ✅ Created
    │
    ├── models/                          🆕 DATA-DRIVEN CONFIG
    │   ├── devices/
    │   │   ├── ac.json                  ✅ Created
    │   │   ├── fan.json                 ✅ Created
    │   │   ├── pump.json                ✅ Created
    │   │   ├── humidifier.json          ✅ Created
    │   │   ├── heater.json              ✅ Created
    │   │   └── growlight.json           ✅ Created
    │   │
    │   ├── crops/
    │   │   ├── tomato.json              ✅ Created
    │   │   └── lettuce.json             ✅ Created
    │   │
    │   └── environment/
    │       └── drift.json                ✅ Created
    │
    ├── engines/                         🆕 OPEN–CLOSED ENGINES
    │   ├── EnvironmentEngine.ts         ✅ Created
    │   ├── DeviceEffectEngine.ts        ✅ Created
    │   ├── SensorEngine.ts              ✅ Created
    │   ├── CropGrowthEngine.ts          ✅ Created
    │   └── FailureEngine.ts             ✅ Created
    │
    ├── simulation/                      🆕 ORCHESTRATION
    │   └── SimulationRunner.ts          ✅ Created
    │
    └── adapters/                        🆕 SAFE BOUNDARY
        └── TelemetryAdapter.ts          ✅ Created
```

## 📊 File Count Summary

- **Existing Files**: All remain unchanged ✅
- **New Domain Files**: 3 files
- **New Model Files**: 9 JSON files
- **New Engine Files**: 5 files
- **New Simulation Files**: 1 file
- **New Adapter Files**: 1 file
- **New Config Files**: 1 file
- **Total New Files**: 20 files

## 🔄 Execution Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    EXISTING FLOW (Unchanged)                 │
└─────────────────────────────────────────────────────────────┘

index.ts
  │
  ├─→ AuthService.login()
  │
  ├─→ AuthService.getDeviceToken()
  │
  ├─→ TelemetryService.execute()
  │     │
  │     ├─→ PayloadBuilder.buildAllTelemetryPayloads()
  │     │
  │     └─→ ProtocolSender.send() → Backend
  │
  └─→ SocketListener (receives commands)


┌─────────────────────────────────────────────────────────────┐
│              NEW SIMULATION FLOW (Optional)                   │
└─────────────────────────────────────────────────────────────┘

index.ts (OPTIONAL integration)
  │
  └─→ SimulationRunner.tick()
        │
        ├─→ EnvironmentEngine.applyDrift()
        │     └─→ models/environment/drift.json
        │
        ├─→ DeviceEffectEngine.apply()
        │     └─→ models/devices/*.json
        │
        ├─→ FailureEngine.inject()
        │
        ├─→ SensorEngine.read()
        │     └─→ Returns sensor readings
        │
        ├─→ CropGrowthEngine.evaluate()
        │     └─→ models/crops/*.json
        │
        └─→ TelemetryAdapter.sendSensorReadings()
              └─→ TelemetryService.execute() (existing)
                    └─→ ProtocolSender.send() → Backend
```

## 🎯 Integration Points

### Point 1: TelemetryAdapter → TelemetryService
- **Status**: Safe boundary maintained
- **Method**: Maps simulation readings to telemetry payloads
- **Compatibility**: Uses existing TelemetryService interface

### Point 2: SocketListener → Device Control
- **Status**: Ready for extension
- **Future**: Process backend commands to update DeviceState
- **Location**: `socket/socket.listener.ts` (existing)

### Point 3: Simulation Config
- **Status**: New config file added
- **Location**: `config/simulation.json`
- **Usage**: Loaded by SimulationRunner

## 🔧 Build Process

### Before Build
```bash
npm run build
```

### Build Steps
1. TypeScript compilation (`tsc`)
2. Copy config files (`cpx "src/config/**/*" dist/config`)
3. Copy model files (`cpx "src/models/**/*" dist/models`) 🆕

### Output Structure
```
dist/
├── config/
│   ├── config.js
│   ├── crops.json
│   └── simulation.json          🆕
│
├── models/                       🆕
│   ├── devices/
│   ├── crops/
│   └── environment/
│
└── [all compiled .js files]
```

## ✅ Verification Checklist

- [x] All domain interfaces created
- [x] All JSON model files created
- [x] All engine classes created
- [x] SimulationRunner orchestrator created
- [x] TelemetryAdapter boundary created
- [x] Simulation config created
- [x] package.json updated (model copy)
- [x] tsconfig.json updated (JSON support)
- [x] No linting errors
- [x] Existing code unchanged
- [x] Backward compatibility maintained

## 🚀 Next Steps (Optional Integration)

1. **Enable Simulation in index.ts** (commented example provided)
2. **Process Socket Commands** (extend socket.listener.ts)
3. **Add More Device Models** (add JSON files to models/devices/)
4. **Add More Crop Models** (add JSON files to models/crops/)
5. **Customize Failure Scenarios** (extend FailureEngine)
6. **Add Multi-Area Support** (extend SimulationRunner)

## 📝 Notes

- All new code is **strictly additive**
- Existing code paths **remain untouched**
- Simulation can be **enabled/disabled** via configuration
- Models can be **extended** by adding new JSON files
- Engines follow **open-closed principle**


