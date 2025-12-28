import fetch from "node-fetch";
import { config } from "../config/config.js";
import {
  DeviceContext,
  LoginResponse,
  DeviceTokenApiResponse,
} from "../types.js";

/**
 * Login with user credentials
 */
export async function login(): Promise<string> {
  const res = await fetch(`${config.baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config.user),
  });

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status}`);
  }

  const json = (await res.json()) as LoginResponse;

  const token = json?.data?.token;
  if (!token) {
    throw new Error("Token missing in login response");
  }

  return token;
}

/**
 * Get device token + device UUID
 */
export async function getDeviceToken(
  userToken: string,
  sensorId: number
): Promise<DeviceContext> {
  const res = await fetch(`${config.baseUrl}/device-tokens`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${userToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sensorId }),
  });

  if (!res.ok) {
    throw new Error(`Device token request failed: ${res.status}`);
  }

  const json = (await res.json()) as DeviceTokenApiResponse;

  const deviceUuid =
    json.data.deviceUuid ??
    json.data.uuid ??
    json.data.device?.uuid;

  if (!deviceUuid) {
    throw new Error("Device UUID missing in device-token response");
  }

  return {
    deviceToken: json.data.token,
    deviceUuid,
  };
}
