export type ProtocolType = "http" | "mqtt" | "coap";

export interface DeviceContext {
  deviceUuid: string;
  deviceToken: string;
}

// export interface TelemetryPayload {
//   telemetryDataId: number;
//   value: number | string;
//   recievedAt: string;
// }

export interface DeviceTokenApiResponse {
    data: {
      token: string;
      deviceUuid?: string;
      uuid?: string;
      device?: {
        uuid: string;
      };
    };
  }
  
  export interface LoginResponse {
    data: {
      token: string;
    };
  }
  

  //
  export interface DeviceContext {
    deviceUuid: string;
    deviceToken: string;
  }

  
  export interface BatchTelemetryPayload {
    dataStreams: TelemetryPayload[];
  }
  
  export interface TelemetrySender {
    send(ctx: DeviceContext, telemetryPayload: TelemetryPayload): Promise<void>;
    sendBatch?(ctx: DeviceContext): Promise<void>;
  }
  export interface TelemetryPayload {
    variableName: string;
    value: string;
    recievedAt: string;
  }
  
  export interface ProtocolContext {
    deviceToken: string;
    deviceUuid: string;
    payload: TelemetryPayload;
  }
  