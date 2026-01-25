# Scalable Data-Driven Architecture Plan

## 🎯 Requirements Summary

1. **Multiple Sensors** with multiple variables (variableName, datatype, minRange, maxRange)
2. **Multiple Devices** with multiple states (deviceUuid, stateName, value)
3. **Data-Driven**: All config in JSON (SQLite-ready for future)
4. **Protocol Support**: Send sensor data via HTTP/MQTT/CoAP
5. **Socket Integration**: Receive device state changes and update device states
6. **Reusable**: Device states accessible for future modules (plants, digital-twin)

## 📁 Proposed File Structure

```
src/
├── config/
│   ├── config.ts                    # Main config (protocol, execution)
│   ├── sensors.json                 # 🆕 Sensor definitions (multiple sensors, multiple variables)
│   └── devices.json                 # 🆕 Device definitions (multiple devices, multiple states)
│
├── data/
│   ├── SensorRepository.ts          # 🆕 Load/manage sensors from JSON
│   ├── DeviceRepository.ts          # 🆕 Load/manage devices from JSON
│   └── DeviceStateStore.ts          # 🆕 Persistent device state management
│
├── payload/
│   └── payload.builder.ts          # 🔄 Refactor: Use SensorRepository (no hardcoding)
│
├── socket/
│   └── socket.listener.ts           # 🔄 Enhanced: Process device-state-change events
│
├── core/
│   ├── TelemetryService.ts          # ✅ Existing (minimal changes)
│   └── AuthService.ts               # ✅ Existing
│
└── protocols/                       # ✅ Existing (no changes)
    ├── http.sender.ts
    ├── mqtt.sender.ts
    └── coap.sender.ts
```

## 📊 Data Models

### 1. Sensor Model (`config/sensors.json`)

```json
{
  "sensors": [
    {
      "sensorId": 1,
      "sensorName": "pH Meter - NFT System",
      "deviceUuid": "sensor-uuid-1",
      "telemetryData": [
        {
          "variableName": "pH Level",
          "datatype": "float",
          "minRange": 0,
          "maxRange": 14
        },
        {
          "variableName": "pH Sensor Voltage",
          "datatype": "float",
          "minRange": 4,
          "maxRange": 8
        }
      ]
    },
    {
      "sensorId": 2,
      "sensorName": "Water Temperature Probe",
      "deviceUuid": "sensor-uuid-2",
      "telemetryData": [
        {
          "variableName": "Water Temperature",
          "datatype": "float",
          "minRange": 8,
          "maxRange": 25
        }
      ]
    }
  ]
}
```

### 2. Device Model (`config/devices.json`)

```json
{
  "devices": [
    {
      "deviceId": 1,
      "deviceUuid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "deviceName": "Main Water Pump",
      "deviceType": "actuator",
      "isCritical": true,
      "states": [
        {
          "stateName": "Pump Power",
          "defaultValue": "off",
          "allowedValues": ["on", "off"]
        },
        {
          "stateName": "Pump Speed",
          "defaultValue": 0,
          "allowedValues": [0, 1, 2, 3, 4, 5]
        }
      ]
    },
    {
      "deviceId": 2,
      "deviceUuid": "another-device-uuid",
      "deviceName": "AC Unit",
      "deviceType": "actuator",
      "isCritical": false,
      "states": [
        {
          "stateName": "AC Power",
          "defaultValue": "off",
          "allowedValues": ["on", "off"]
        },
        {
          "stateName": "Temperature Setpoint",
          "defaultValue": 22,
          "allowedValues": "number" // Range: 16-30
        }
      ]
    }
  ]
}
```

### 3. Device State Store (Runtime - JSON file for persistence)

```json
{
  "devices": {
    "d290f1ee-6c54-4b01-90e6-d701748f0851": {
      "deviceId": 1,
      "deviceUuid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
      "deviceName": "Main Water Pump",
      "deviceType": "actuator",
      "states": {
        "Pump Power": "off",
        "Pump Speed": 0
      },
      "lastUpdated": "2026-01-02T22:27:10.950Z"
    }
  }
}
```

## 🔧 Implementation Plan

### Phase 1: Data Models & Repositories

#### 1.1 Create `config/sensors.json`
- Define sensor structure with multiple variables
- Each variable has: variableName, datatype, minRange, maxRange

#### 1.2 Create `config/devices.json`
- Define device structure with multiple states
- Each device has: deviceId, deviceUuid, deviceName, deviceType, states[]
- Each state has: stateName, defaultValue, allowedValues

#### 1.3 Create `data/SensorRepository.ts`
```typescript
export class SensorRepository {
  private sensors: Sensor[];
  
  loadFromFile(path: string): void;
  getSensor(sensorId: number): Sensor | undefined;
  getAllSensors(): Sensor[];
  getSensorVariables(sensorId: number): TelemetryVariable[];
}
```

#### 1.4 Create `data/DeviceRepository.ts`
```typescript
export class DeviceRepository {
  private devices: Device[];
  
  loadFromFile(path: string): void;
  getDevice(deviceUuid: string): Device | undefined;
  getAllDevices(): Device[];
  getDeviceStates(deviceUuid: string): DeviceState[];
}
```

#### 1.5 Create `data/DeviceStateStore.ts`
```typescript
export class DeviceStateStore {
  private stateFile: string;
  private deviceStates: Map<string, DeviceState>;
  
  loadFromFile(path: string): void;
  saveToFile(): void;
  updateDeviceState(deviceUuid: string, stateName: string, value: any): void;
  getDeviceState(deviceUuid: string, stateName?: string): any;
  getAllDeviceStates(): Map<string, DeviceState>;
}
```

### Phase 2: Refactor Payload Builder

#### 2.1 Update `payload/payload.builder.ts`
```typescript
export class PayloadBuilder {
  constructor(private sensorRepo: SensorRepository) {}
  
  buildTelemetryPayload(sensorId: number, variableName?: string): TelemetryPayload;
  buildAllTelemetryPayloads(sensorId: number): TelemetryPayload[];
  buildBatchPayload(sensorIds: number[]): BatchTelemetryPayload;
  
  private generateValue(variable: TelemetryVariable): string;
}
```

**Key Changes:**
- Remove all hardcoded values
- Use SensorRepository to get sensor config
- Generate values based on datatype, minRange, maxRange
- Support multiple variables per sensor

### Phase 3: Socket Integration

#### 3.1 Update `socket/socket.listener.ts`
```typescript
export function startSocketListener(
  onDeviceStateChange?: (event: DeviceStateChangeEvent) => void
): Socket {
  socket.on("device-state-change", (data) => {
    if (onDeviceStateChange) {
      onDeviceStateChange(data);
    }
  });
}
```

#### 3.2 Create `core/DeviceStateManager.ts`
```typescript
export class DeviceStateManager {
  constructor(
    private deviceRepo: DeviceRepository,
    private stateStore: DeviceStateStore
  ) {}
  
  processStateChange(event: DeviceStateChangeEvent): void {
    // 1. Validate device exists in config
    // 2. Validate stateName exists for device
    // 3. Validate newValue is allowed
    // 4. Update state store
    // 5. Save to file
  }
  
  getDeviceState(deviceUuid: string, stateName?: string): any;
  getAllDeviceStates(): Map<string, DeviceState>;
}
```

### Phase 4: Integration

#### 4.1 Update `index.ts`
```typescript
// Load repositories
const sensorRepo = new SensorRepository();
sensorRepo.loadFromFile("./config/sensors.json");

const deviceRepo = new DeviceRepository();
deviceRepo.loadFromFile("./config/devices.json");

const stateStore = new DeviceStateStore();
stateStore.loadFromFile("./data/device-states.json");

// Initialize managers
const payloadBuilder = new PayloadBuilder(sensorRepo);
const deviceStateManager = new DeviceStateManager(deviceRepo, stateStore);

// Setup socket listener
startSocketListener((event) => {
  deviceStateManager.processStateChange(event);
});

// Update TelemetryService to use PayloadBuilder
const service = new TelemetryService(sender, payloadBuilder);
```

## 🔄 Data Flow

### Sensor Data Flow
```
sensors.json
  ↓
SensorRepository.loadFromFile()
  ↓
PayloadBuilder.buildTelemetryPayload(sensorId)
  ↓
Generate value based on variable config (datatype, minRange, maxRange)
  ↓
TelemetryService.execute()
  ↓
ProtocolSender.send() → Backend
```

### Device State Flow
```
Backend sends: device-state-change event
  ↓
SocketListener receives event
  ↓
DeviceStateManager.processStateChange(event)
  ↓
Validate against devices.json
  ↓
Update DeviceStateStore
  ↓
Save to device-states.json
  ↓
State available for other modules
```

## 📝 Key Design Decisions

### 1. Separation of Concerns
- **Config**: Static definitions (sensors.json, devices.json)
- **State**: Runtime state (device-states.json)
- **Repositories**: Data access layer
- **Managers**: Business logic

### 2. Extensibility
- JSON files → Easy to migrate to SQLite later
- Repository pattern → Swap data source without changing business logic
- State store → Centralized state management for all modules

### 3. Validation
- Device must exist in devices.json before updating state
- StateName must exist for device
- newValue must be in allowedValues

### 4. Reusability
- DeviceStateStore provides public API for other modules
- State persisted to JSON (can be read by other processes)
- Type-safe interfaces for state access

## 🚀 Migration Path to SQLite

Future enhancement (not in scope now):
1. Create `data/SqliteSensorRepository.ts` implementing same interface
2. Create `data/SqliteDeviceRepository.ts` implementing same interface
3. Create `data/SqliteDeviceStateStore.ts` implementing same interface
4. Swap implementations in `index.ts` - no other code changes needed

## ✅ Implementation Checklist

### Phase 1: Data Models
- [ ] Create `config/sensors.json` with sample sensors
- [ ] Create `config/devices.json` with sample devices
- [ ] Create TypeScript interfaces for Sensor, Device, DeviceState
- [ ] Create `data/SensorRepository.ts`
- [ ] Create `data/DeviceRepository.ts`
- [ ] Create `data/DeviceStateStore.ts`

### Phase 2: Payload Builder
- [ ] Refactor `payload/payload.builder.ts` to use SensorRepository
- [ ] Implement value generation based on datatype (float, integer, percentage)
- [ ] Support multiple variables per sensor
- [ ] Remove all hardcoded values

### Phase 3: Socket Integration
- [ ] Update `socket/socket.listener.ts` to handle device-state-change
- [ ] Create `core/DeviceStateManager.ts`
- [ ] Implement state validation and update logic
- [ ] Add state persistence to JSON file

### Phase 4: Integration
- [ ] Update `index.ts` to initialize repositories and managers
- [ ] Update `core/TelemetryService.ts` to use new PayloadBuilder
- [ ] Wire up socket listener with DeviceStateManager
- [ ] Test end-to-end flow

### Phase 5: Testing & Documentation
- [ ] Test with multiple sensors
- [ ] Test with multiple devices
- [ ] Test with multiple states per device
- [ ] Verify state persistence
- [ ] Document API for future modules

## 📋 Example Usage

### Getting Device State (for future modules)
```typescript
const stateStore = new DeviceStateStore();
stateStore.loadFromFile("./data/device-states.json");

// Get specific state
const pumpPower = stateStore.getDeviceState(
  "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "Pump Power"
); // Returns: "off"

// Get all states for device
const allStates = stateStore.getDeviceState(
  "d290f1ee-6c54-4b01-90e6-d701748f0851"
); // Returns: { "Pump Power": "off", "Pump Speed": 0 }

// Get all device states
const allDevices = stateStore.getAllDeviceStates();
```

## 🎯 Benefits

1. **Scalable**: Add sensors/devices by editing JSON files
2. **Data-Driven**: No hardcoding, all config in JSON
3. **Extensible**: Easy to add SQLite support later
4. **Reusable**: DeviceStateStore accessible to all modules
5. **Type-Safe**: TypeScript interfaces for all data structures
6. **Maintainable**: Clear separation of concerns

