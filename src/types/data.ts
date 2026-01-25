/**
 * Type definitions matching backend database schema
 */

// Sensor Schema (matches aemos_core.Sensor)
export interface Sensor {
  id: number;
  name: string | null;
  description: string | null;
  uuid: string | null;
  status: "active" | "inactive" | "pending" | "calibrating" | "error" | "disconnected" | "retired";
  createdAt?: string | null;
  updatedAt?: string | null;
}

// TelemetryData Schema (matches aemos_core.TelemetryData)
export interface TelemetryData {
  id: number;
  variableName: string | null;
  datatype: string | null;
  sensorId: number | null;
  minRange?: number; // Extended field for value generation
  maxRange?: number; // Extended field for value generation
}

// Sensor with TelemetryData (for JSON structure)
export interface SensorWithTelemetryData extends Sensor {
  telemetryData: TelemetryData[];
}

// Device Schema (matches aemos_core.Device)
export interface Device {
  id: number;
  name: string | null;
  description: string | null;
  uuid: string | null;
  status: "active" | "inactive" | "pending" | "maintenance" | "faulty" | "retired";
  deviceType: "actuator" | "controller" | "gateway" | "sensor_hub" | "hybrid" | "other";
  communicationProtocol?: "wifi" | "ble" | "lorawan" | "zigbee" | "modbus" | "mqtt" | "http" | "coap" | "other" | null;
  isCritical: boolean;
  lastHeartbeat?: string | null;
  metadata?: Record<string, any> | null;
  capabilities?: Record<string, any> | null;
  controlModes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

// DeviceState Schema (matches aemos_core.DeviceState)
export interface DeviceState {
  id: number;
  deviceId: number;
  stateName: string;
  dataType: string;
  defaultValue: string | null;
  allowedValues: any; // JSON - can be array, object, or string
  status: "active" | "suspended" | "inactive";
  createdAt?: string;
}

// Device with DeviceStates (for JSON structure)
export interface DeviceWithStates extends Device {
  deviceStates: DeviceState[];
}

// DeviceStateInstance Schema (matches aemos_core.DeviceStateInstance)
export interface DeviceStateInstance {
  id?: number;
  deviceStateId: number;
  value: string;
  fromTimestamp: string;
  toTimestamp?: string | null;
  initiatedBy?: string | null;
  initiatorId?: number | null;
}

// Runtime Device State (simplified for JSON storage)
export interface RuntimeDeviceState {
  deviceId: number;
  deviceUuid: string;
  deviceName: string;
  deviceType: string;
  states: Record<string, string>; // stateName -> value
  lastUpdated: string;
}

// Device State Change Event (from socket)
export interface DeviceStateChangeEvent {
  title?: string;
  message?: string;
  type?: string;
  deviceType?: string;
  deviceId?: number;
  deviceUuid?: string;
  priority?: string;
  timestamp?: string;
  metadata: {
    deviceId?: number;
    deviceUuid?: string;
    deviceName?: string;
    deviceType?: string;
    isCritical?: boolean;
    stateName: string;
    oldValue?: string;
    newValue: string;
    initiatedBy?: string;
    triggeredBy?: string;
    ruleChainDetails?: {
      ruleChainId?: number;
      ruleChainName?: string;
    };
  };
}

