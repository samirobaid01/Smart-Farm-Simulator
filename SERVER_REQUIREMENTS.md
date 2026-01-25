# Server Requirements & API Contract

This document outlines the **critical requirements** your server must maintain to keep the Smart Farm Simulator application working without breaking changes.

## 🔐 Authentication API

### Endpoint: `POST /api/v1/auth/login`
**Base URL**: `http://localhost:3000/api/v1` (configurable)

**Request:**
```json
{
  "email": "samiradmin@yopmail.com",
  "password": "1234Abcd"
}
```

**Response (REQUIRED FORMAT):**
```json
{
  "data": {
    "token": "jwt-token-string"
  }
}
```

**Critical Requirements:**
- ✅ Must return `200 OK` on success
- ✅ Response must have `data.token` field (exactly this structure)
- ✅ Token must be a valid JWT string

---

## 🔑 Device Token API

### Endpoint: `POST /api/v1/device-tokens`
**Headers:**
- `Authorization: Bearer {userToken}`
- `Content-Type: application/json`

**Request:**
```json
{
  "sensorId": 1
}
```

**Response (REQUIRED FORMAT - one of these structures):**
```json
{
  "data": {
    "token": "device-token-string",
    "deviceUuid": "d290f1ee-6c54-4b01-90e6-d701748f0851"
  }
}
```

**OR:**
```json
{
  "data": {
    "token": "device-token-string",
    "uuid": "d290f1ee-6c54-4b01-90e6-d701748f0851"
  }
}
```

**OR:**
```json
{
  "data": {
    "token": "device-token-string",
    "device": {
      "uuid": "d290f1ee-6c54-4b01-90e6-d701748f0851"
    }
  }
}
```

**Critical Requirements:**
- ✅ Must return `200 OK` on success
- ✅ Must accept `sensorId` in request body
- ✅ Response must have `data.token` field
- ✅ Response must have `deviceUuid` in one of these locations:
  - `data.deviceUuid` (preferred)
  - `data.uuid` (fallback)
  - `data.device.uuid` (fallback)
- ✅ Device UUID must be a valid UUID string

---

## 📡 Telemetry Data API

### Endpoint: `POST /api/v1/datastreams/token`
**Headers:**
- `Authorization: Bearer {deviceToken}`
- `Content-Type: application/json`

**Request:**
```json
{
  "variableName": "pH Level",
  "value": "7.23",
  "recievedAt": "2026-01-02T22:27:10.950Z"
}
```

**Critical Requirements:**
- ✅ Must accept POST requests with device token authentication
- ✅ Must accept `variableName` (string)
- ✅ Must accept `value` (string - note: value is always sent as string)
- ✅ Must accept `recievedAt` (ISO 8601 timestamp string)
- ✅ Note: Field name is `recievedAt` (with "ie", not "ei")

---

## 📦 Batch Telemetry API

### Endpoint: `POST /api/v1/datastreams/batch`
**Headers:**
- `Authorization: Bearer {deviceToken}`
- `Content-Type: application/json`

**Request:**
```json
{
  "dataStreams": [
    {
      "variableName": "pH Level",
      "value": "7.23",
      "recievedAt": "2026-01-02T22:27:10.950Z"
    },
    {
      "variableName": "Water Temperature",
      "value": "18.5",
      "recievedAt": "2026-01-02T22:27:10.950Z"
    }
  ]
}
```

**Critical Requirements:**
- ✅ Must accept POST requests with device token authentication
- ✅ Must accept `dataStreams` array
- ✅ Each item in array follows same format as single telemetry payload

---

## 🔌 Socket.IO Connection

### Connection Details
- **URL**: `http://localhost:3000`
- **Transport**: WebSocket only (`transports: ["websocket"]`)
- **Library**: Socket.IO Client (compatible with Socket.IO v3+)

**Critical Requirements:**
- ✅ Must support Socket.IO protocol
- ✅ Must accept WebSocket connections on port 3000 (or configured port)
- ✅ Must emit `connect` event when client connects
- ✅ Socket ID must be available via `socket.id`

---

## 📨 Socket Events - Device State Changes

### Event Name: Any event that contains device state change data

**Event Format (REQUIRED):**
```json
{
  "title": "Device State Changed",
  "message": "Pump Power changed to off",
  "type": "device-state-change",
  "deviceType": "actuator",
  "deviceId": 1,
  "deviceUuid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
  "priority": "high",
  "timestamp": "2026-01-02T22:27:10.950Z",
  "metadata": {
    "deviceId": 1,
    "deviceUuid": "d290f1ee-6c54-4b01-90e6-d701748f0851",
    "deviceName": "Main Water Pump",
    "deviceType": "actuator",
    "isCritical": true,
    "stateName": "Pump Power",
    "oldValue": "on",
    "newValue": "off",
    "initiatedBy": "user",
    "triggeredBy": "rule-chain",
    "ruleChainDetails": {
      "ruleChainId": 5,
      "ruleChainName": "Auto Pump Control"
    }
  }
}
```

**Critical Requirements:**
- ✅ Event must include `deviceUuid` at root level OR in `metadata.deviceUuid`
- ✅ Event must include `metadata.stateName` (string)
- ✅ Event must include `metadata.newValue` (string or number - will be converted to string)
- ✅ Event may include `metadata.oldValue` (optional but recommended)
- ✅ Event may include other metadata fields (all optional)
- ✅ Application listens to **ALL events** via `socket.onAny()` and processes any event matching this structure

**Field Priority:**
- `deviceUuid` is checked in this order: `event.deviceUuid` → `event.metadata.deviceUuid`
- If `deviceUuid` is missing, event is ignored (warning logged)
- If `metadata.stateName` is missing, event is ignored (warning logged)
- If `metadata.newValue` is missing, event is ignored (warning logged)

---

## 🔄 Protocol Support

The application supports three protocols. Your server must support at least one:

### 1. HTTP (Currently Used)
- Base URL: `http://localhost:3000/api/v1`
- All endpoints listed above

---

### 2. MQTT Protocol

**Broker Configuration:**
- **Broker URL**: `mqtt://localhost:1883` (configurable)
- **Protocol**: MQTT 3.1.1 or higher

**Connection Details:**
- **Client ID**: `{deviceUuid}` (uses device UUID as client identifier)
- **Username**: `{deviceUuid}` (device UUID used as username)
- **Password**: `{deviceToken}` (device token used as password)
- **QoS Level**: `1` (at least once delivery)

**Topic Structure:**

**Single Telemetry:**
- **Topic**: `devices/{deviceUuid}/datastream`
- **Payload Format:**
```json
{
  "variableName": "pH Level",
  "value": "7.23",
  "recievedAt": "2026-01-02T22:27:10.950Z",
  "token": "device-token-string"
}
```

**Batch Telemetry:**
- **Topic**: `devices/{deviceUuid}/datastream/batch`
- **Payload Format:**
```json
{
  "dataStreams": [
    {
      "variableName": "pH Level",
      "value": "7.23",
      "recievedAt": "2026-01-02T22:27:10.950Z"
    },
    {
      "variableName": "Water Temperature",
      "value": "18.5",
      "recievedAt": "2026-01-02T22:27:10.950Z"
    }
  ],
  "token": "device-token-string"
}
```

**Critical Requirements:**
- ✅ Must accept connections with device UUID as username
- ✅ Must authenticate using device token as password
- ✅ Must support QoS level 1
- ✅ Must subscribe to topic before publishing (application subscribes to same topic)
- ✅ Must handle topic pattern: `devices/{deviceUuid}/datastream` and `devices/{deviceUuid}/datastream/batch`
- ✅ Payload must be valid JSON
- ✅ Application expects to receive messages on subscribed topics (for confirmation)

**Example Device UUID**: `d290f1ee-6c54-4b01-90e6-d701748f0851`
**Example Topic**: `devices/d290f1ee-6c54-4b01-90e6-d701748f0851/datastream`

---

### 3. CoAP Protocol

**Server Configuration:**
- **Host**: `localhost` (configurable)
- **Port**: `5683` (default CoAP port)
- **Protocol**: CoAP (RFC 7252)

**Single Telemetry:**
- **Path**: `/datastreams`
- **Method**: `POST`
- **Message Type**: Confirmable (CON)
- **Content Format**: JSON

**Request Payload:**
```json
{
  "variableName": "pH Level",
  "value": "7.23",
  "recievedAt": "2026-01-02T22:27:10.950Z",
  "token": "device-token-string",
  "deviceUuid": "d290f1ee-6c54-4b01-90e6-d701748f0851"
}
```

**Batch Telemetry:**
- **Path**: `/datastreams/batch`
- **Method**: `POST`
- **Message Type**: Confirmable (CON)
- **Content Format**: JSON

**Request Payload:**
```json
{
  "dataStreams": [
    {
      "variableName": "pH Level",
      "value": "7.23",
      "recievedAt": "2026-01-02T22:27:10.950Z"
    },
    {
      "variableName": "Water Temperature",
      "value": "18.5",
      "recievedAt": "2026-01-02T22:27:10.950Z"
    }
  ],
  "token": "device-token-string",
  "deviceUuid": "d290f1ee-6c54-4b01-90e6-d701748f0851"
}
```

**Observe Mode (Optional):**
- **Path**: `/datastreams` (or custom path)
- **Method**: `GET`
- **Observe Option**: `true`
- **Purpose**: Server can push updates to observing clients

**Critical Requirements:**
- ✅ Must accept POST requests to `/datastreams` and `/datastreams/batch`
- ✅ Must use Confirmable (CON) message type (application sends confirmable messages)
- ✅ Must respond with CoAP response code (2.xx for success)
- ✅ Must accept JSON payload in request body
- ✅ Payload includes `token` and `deviceUuid` in addition to telemetry data
- ✅ Must support Observe option for GET requests (if observe mode is enabled)
- ✅ Response should include status code (application logs response code)

**Response Codes:**
- `2.01 Created` - Successfully created telemetry entry
- `2.04 Changed` - Successfully updated
- `4.00 Bad Request` - Invalid payload
- `4.01 Unauthorized` - Invalid token
- `4.04 Not Found` - Invalid path or device

**Note**: Application expects CoAP responses and logs the response code or data.

---

## ⚠️ Breaking Changes to Avoid

### ❌ DO NOT:
1. **Change response structure** for `/auth/login` - must keep `data.token`
2. **Remove deviceUuid** from device-token response - must be in one of the three supported locations
3. **Change field names** - `recievedAt` (not `receivedAt`), `variableName`, `value`
4. **Remove metadata fields** - `metadata.stateName` and `metadata.newValue` are required
5. **Change Socket.IO protocol** - must remain Socket.IO compatible
6. **Remove deviceUuid** from socket events - must be present at root or in metadata
7. **Change authentication format** - Bearer token format must remain (HTTP) or UUID/token auth (MQTT)
8. **Change MQTT topic structure** - must keep `devices/{deviceUuid}/datastream` pattern
9. **Change MQTT authentication** - must use device UUID as username, token as password
10. **Change CoAP paths** - must keep `/datastreams` and `/datastreams/batch` paths
11. **Change CoAP message type** - must accept Confirmable (CON) messages
12. **Remove token/deviceUuid from MQTT/CoAP payloads** - these are included in addition to telemetry data

### ✅ SAFE TO CHANGE:
1. Add new optional fields to responses
2. Add new socket event types (application only processes matching structure)
3. Change port numbers (if config is updated)
4. Add validation or business logic (as long as format remains)
5. Add new endpoints (won't break existing functionality)

---

## 📋 Summary Checklist for Server Agent

When making changes to the server, ensure:

### HTTP Protocol (if used):
- [ ] `/api/v1/auth/login` returns `{ data: { token: string } }`
- [ ] `/api/v1/device-tokens` returns device UUID in one of: `data.deviceUuid`, `data.uuid`, or `data.device.uuid`
- [ ] `/api/v1/datastreams/token` accepts `{ variableName, value, recievedAt }`
- [ ] `/api/v1/datastreams/batch` accepts `{ dataStreams: [...] }`
- [ ] All HTTP endpoints use Bearer token authentication where specified

### MQTT Protocol (if used):
- [ ] MQTT broker accepts connections on `mqtt://localhost:1883`
- [ ] Authentication uses device UUID as username and device token as password
- [ ] Topic `devices/{deviceUuid}/datastream` accepts single telemetry payloads
- [ ] Topic `devices/{deviceUuid}/datastream/batch` accepts batch telemetry payloads
- [ ] QoS level 1 is supported
- [ ] Payload includes `token` field in addition to telemetry data

### CoAP Protocol (if used):
- [ ] CoAP server listens on `localhost:5683`
- [ ] Path `/datastreams` accepts POST requests with confirmable messages
- [ ] Path `/datastreams/batch` accepts POST requests with confirmable messages
- [ ] Payload includes `token` and `deviceUuid` fields in addition to telemetry data
- [ ] Server responds with appropriate CoAP response codes (2.xx for success)

### Socket.IO (always used):
- [ ] Socket.IO connection works on WebSocket transport
- [ ] Socket events include `deviceUuid` (root or metadata)
- [ ] Socket events include `metadata.stateName` and `metadata.newValue`

### General:
- [ ] Field names remain exactly as specified (case-sensitive, e.g., `recievedAt` not `receivedAt`)

---

## 🔍 Testing Compatibility

To verify your server changes don't break the application:

### HTTP Protocol:
1. **Authentication**: Test login returns correct structure
2. **Device Tokens**: Test device-token endpoint returns UUID in supported format
3. **Telemetry**: Send a test telemetry payload to `/api/v1/datastreams/token`
4. **Batch Telemetry**: Send a test batch payload to `/api/v1/datastreams/batch`

### MQTT Protocol:
1. **Connection**: Connect to MQTT broker using device UUID as username and token as password
2. **Single Telemetry**: Publish to `devices/{deviceUuid}/datastream` with telemetry payload + token
3. **Batch Telemetry**: Publish to `devices/{deviceUuid}/datastream/batch` with batch payload + token
4. **QoS**: Verify QoS level 1 is supported

### CoAP Protocol:
1. **Connection**: Connect to CoAP server on port 5683
2. **Single Telemetry**: POST to `/datastreams` with confirmable message containing telemetry + token + deviceUuid
3. **Batch Telemetry**: POST to `/datastreams/batch` with confirmable message containing batch payload + token + deviceUuid
4. **Response**: Verify server responds with CoAP success code (2.xx)

### Socket.IO:
1. **Connection**: Connect via Socket.IO on WebSocket transport
2. **Events**: Emit a device-state-change event with required fields
3. **Validation**: Verify application processes the event correctly

### General:
1. **Check Logs**: Application logs warnings if required fields are missing
2. **Field Names**: Verify exact field names (case-sensitive, e.g., `recievedAt`)

---

## 📞 Contact Points in Code

If you need to understand how the application uses these APIs:

- **Authentication**: `src/core/AuthService.ts`
- **HTTP Telemetry**: `src/protocols/http.sender.ts`
- **MQTT Telemetry**: `src/protocols/mqtt.sender.ts`
- **CoAP Telemetry**: `src/protocols/coap.sender.ts`
- **Socket Listening**: `src/socket/socket.listener.ts`
- **State Management**: `src/core/DeviceStateManager.ts`
- **Configuration**: `src/config/config.ts`
- **Main Entry**: `src/index.ts`

---

**Last Updated**: Based on current codebase structure
**Application Version**: Smart Farm Simulator v1.0
