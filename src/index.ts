import { config } from "./config/config.js";
import { login, getDeviceToken } from "./core/AuthService.js";
import { TelemetryService } from "./core/TelemetryService.js";
import { HttpSender } from "./protocols/http.sender.js";
import { MqttSender } from "./protocols/mqtt.sender.js";
import { CoapSender } from "./protocols/coap.sender.js";
import { startSocketListener } from "./socket/socket.listener.js";
import { DeviceContext } from "./types.js";

startSocketListener();

const sender =
  config.protocol === "http"
    ? new HttpSender()
    : config.protocol === "mqtt"
    ? new MqttSender()
    : new CoapSender();

(async () => {
  const userToken = await login();

  const devicesContext: DeviceContext[] = [];

  for (const d of config.devices) {
    const ctx = await getDeviceToken(userToken, d.sensorId);
    devicesContext.push(ctx);
  }
  

  const service = new TelemetryService(sender);
  while (true) {
    console.log("Executing telemetry for devices");
    await service.execute(devicesContext);
    await new Promise(resolve => setTimeout(resolve, config.execution.delayMs));
    console.log(`Waiting for next execution in ${config.execution.delayMs}ms`);
    if (config.execution.mode === "once") {
        console.log("Execution mode is once, exiting...");
        await service.execute(devicesContext);
        break;
    }
    if (config.execution.mode === "loop") {
        await service.execute(devicesContext);
        await new Promise(resolve => setTimeout(resolve, config.execution.delayMs));
        console.log(`Waiting for next execution in ${config.execution.delayMs}ms`);
    }
    if (config.execution.mode === "batch") {
        console.log("Execution mode is batch, executing batch...");
        await service.executeBatch(devicesContext);
        await new Promise(resolve => setTimeout(resolve, config.execution.delayMs));
        console.log(`Waiting for next execution in ${config.execution.delayMs}ms`);
    }
  }
})();
