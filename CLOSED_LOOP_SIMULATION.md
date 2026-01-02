# Closed-Loop Simulation Guide

## 🎯 Overview

The closed-loop simulation creates a **complete feedback loop** between your application and the backend server:

1. **Send sensor data** → Backend
2. **Receive device commands** ← Backend (via WebSocket)
3. **Update device states** (AC, fan, pump, etc.)
4. **Apply device effects** → Environment changes
5. **Generate new sensor readings** from updated environment
6. **Loop** back to step 1

## 📊 Example Flow

```
Initial State: Temperature = 35°C
  ↓
App sends: { temperature: 35 } → Backend
  ↓
Backend responds: { deviceId: "ac-1", status: "ON" } ← Socket
  ↓
App updates: AC device = ON
  ↓
Simulation applies: AC effect → temperature decreases gradually
  ↓
After 5 seconds: Temperature = 32°C
  ↓
App sends: { temperature: 32 } → Backend
  ↓
Backend responds: { deviceId: "ac-1", status: "ON" } (still on)
  ↓
... continues until temperature reaches target (e.g., 22°C)
  ↓
Backend responds: { deviceId: "ac-1", status: "OFF" }
  ↓
Temperature stabilizes with natural drift
```

## 🚀 How to Enable

### Option 1: Enable in `index.ts`

Set the flag at the top of `index.ts`:

```typescript
const ENABLE_CLOSED_LOOP_SIMULATION = true;
```

### Option 2: Use Environment Variable (Future)

```bash
ENABLE_CLOSED_LOOP=true npm start
```

## 🔧 Configuration

### Initial Temperature

You can set the starting temperature in `index.ts`:

```typescript
const simulation = new ClosedLoopSimulation(
  service,
  devicesContext,
  deviceSensorMap,
  35 // Start with 35°C to trigger AC
);
```

### Tick Interval

The simulation runs every `config.execution.delayMs` milliseconds (default: 20000ms = 20 seconds).

You can change this in `config/config.ts`:

```typescript
execution: {
  delayMs: 5000, // 5 seconds
}
```

## 📡 Backend Integration

### Expected Socket Events

The socket listener listens for these events from the backend:

1. **`device:control`** - Device control commands
2. **`device:status`** - Device status updates
3. **`command`** - Generic commands

### Expected Command Format

```json
{
  "deviceId": "ac-1",
  "deviceUuid": "ac-1",  // Alternative field name
  "status": "ON",        // or "OFF"
  "level": 50            // Optional: intensity level (0-100)
}
```

### Example Backend Response

```javascript
// Backend sends via socket.io
socket.emit("device:control", {
  deviceId: "ac-1",
  status: "ON",
  level: 75
});
```

## 🔄 Simulation Flow Details

### Step 1: Send Sensor Data

The simulation reads the current environment state and sends it as telemetry:

```typescript
// Environment state
{
  temperature: 35.0,
  humidity: 60.0,
  soilMoisture: 50.0,
  lightLux: 10000,
  oxygenPPM: 21.0
}

// Mapped to telemetry payloads
{
  variableName: "Water Temperature",
  value: "35.00",
  recievedAt: "2024-01-01T12:00:00.000Z"
}
```

### Step 2: Receive Device Commands

The socket listener receives commands and updates device states:

```typescript
// Backend sends: { deviceId: "ac-1", status: "ON" }
// DeviceManager updates: AC device status = ON
```

### Step 3: Apply Device Effects

The `DeviceEffectEngine` applies device effects to the environment:

```typescript
// AC device is ON
// From models/devices/ac.json:
{
  "effects": {
    "temperature": -0.5,  // Decreases temperature by 0.5°C per tick
    "humidity": -0.1      // Decreases humidity by 0.1% per tick
  }
}
```

### Step 4: Environmental Drift

The `EnvironmentEngine` applies natural drift (weather, time):

```typescript
// From models/environment/drift.json:
{
  "temperature": [-0.2, 0.2],  // Random drift between -0.2 and +0.2°C
  "humidity": [-0.5, 0.5]      // Random drift between -0.5 and +0.5%
}
```

### Step 5: Generate New Readings

The `SensorEngine` reads the updated environment:

```typescript
// After AC running for 5 ticks (25 seconds):
// Temperature: 35°C → 32.5°C (AC effect: -2.5°C)
// New reading sent to backend
```

## 📁 File Structure

```
src/
├── core/
│   ├── ClosedLoopSimulation.ts      # Main orchestrator
│   ├── DeviceManager.ts             # Manages device states
│   ├── SimulationTelemetryAdapter.ts # Maps environment to telemetry
│   └── TelemetryService.ts           # Sends telemetry (enhanced)
│
├── socket/
│   └── socket.listener.ts           # Receives device commands
│
├── simulation/
│   └── SimulationRunner.ts          # Simulation engine
│
└── engines/
    ├── EnvironmentEngine.ts         # Environmental drift
    ├── DeviceEffectEngine.ts        # Device effects
    └── SensorEngine.ts              # Sensor readings
```

## 🎮 Usage Example

### Complete Example

```typescript
// 1. Initialize
const simulation = new ClosedLoopSimulation(
  telemetryService,
  deviceContexts,
  deviceSensorMap,
  35 // Start at 35°C
);

// 2. Set up command handler
setDeviceCommandHandler((command) => {
  simulation.processDeviceCommand(command);
});

// 3. Start simulation
simulation.start(5000); // Run every 5 seconds

// 4. Monitor
setInterval(() => {
  const env = simulation.getEnvironment();
  const devices = simulation.getDevices();
  console.log("Temperature:", env.temperature);
  console.log("Active devices:", devices.filter(d => d.status === "ON"));
}, 10000);
```

## 🔍 Monitoring

### Console Output

The simulation logs detailed information:

```
🚀 Starting closed-loop simulation...
📊 Initial environment: { temperature: '35.00', humidity: '60.00', ... }
📡 Sensor readings: { temperature: '35.00', ... }
📤 Sent: Water Temperature = 35.00
🔧 Processing device command: { deviceId: 'ac-1', status: 'ON' }
✅ Device updated: ac-1 → ON
🔌 Active devices: AC(ac-1)
📡 Sensor readings: { temperature: '34.50', ... }
📤 Sent: Water Temperature = 34.50
```

### Device States

Check current device states:

```typescript
const devices = simulation.getDevices();
devices.forEach(device => {
  console.log(`${device.type}: ${device.status}`);
});
```

### Environment State

Check current environment:

```typescript
const env = simulation.getEnvironment();
console.log(`Temperature: ${env.temperature}°C`);
console.log(`Humidity: ${env.humidity}%`);
```

## 🐛 Troubleshooting

### Devices Not Updating

1. **Check socket connection**: Look for `🟢 Socket connected` in logs
2. **Verify event names**: Backend must send `device:control`, `device:status`, or `command`
3. **Check command format**: Must include `deviceId` or `deviceUuid`

### Temperature Not Changing

1. **Check device status**: Verify device is actually `ON`
2. **Check device model**: Ensure JSON file exists in `models/devices/`
3. **Check device type**: Must match exactly (e.g., "AC" not "ac")

### No Telemetry Sent

1. **Check sensor mapping**: Verify sensor ID matches in `SimulationTelemetryAdapter`
2. **Check device contexts**: Ensure `deviceContexts` are properly initialized
3. **Check network**: Verify backend is reachable

## 🔮 Future Enhancements

1. **Multiple Areas**: Support multiple farm areas with separate environments
2. **Crop Integration**: Include crop growth in the loop
3. **Failure Injection**: Test resilience with device failures
4. **Historical Logging**: Store environment and device state history
5. **Dashboard**: Real-time visualization of simulation state

## 📝 Notes

- The simulation runs **asynchronously** - device commands are processed immediately
- Device effects are applied **per tick** - gradual changes over time
- Environmental drift adds **realism** - simulates weather and time effects
- All device models are **data-driven** - modify JSON files to change behavior
- The system is **backward compatible** - original telemetry mode still works


