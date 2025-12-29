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

  for (const d of config.SensorDevices) {
    const ctx = await getDeviceToken(userToken, d.sensorId);
    devicesContext.push(ctx);
  }
  

  const service = new TelemetryService(sender);
  while (true) {
    console.log("Executing telemetry for devices");
    console.log(`Waiting for next execution in ${config.execution.delayMs}ms`);
    if (config.execution.mode === "once") {
        console.log("Execution mode is once, exiting...");
        await service.execute(devicesContext);
        await new Promise(resolve => setTimeout(resolve, config.execution.delayMs));
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

// import { Simulator } from "./core/SimulationRunner.js";
// import { FarmArea } from "./core/Environment.js";
// import { chooseCrop } from "./core/CropLoader.js";
// import { Crop } from "./core/Crop.js";

// const simulatorInstance = new Simulator();

// // Area 1 with Tomato & Lettuce
// const area1 = new FarmArea();
// const tomato = chooseCrop("Tomato");
// const lettuce = chooseCrop("Lettuce");
// if (tomato) area1.addCrop(new Crop(tomato));
// if (lettuce) area1.addCrop(new Crop(lettuce));

// simulatorInstance.addArea(area1);

// console.log("[SIM] Starting Smart Farm Simulator...");
// simulatorInstance.start();
