import { config } from "./config/config.js";
import { login, getDeviceToken } from "./core/AuthService.js";
import { TelemetryService } from "./core/TelemetryService.js";
import { HttpSender } from "./protocols/http.sender.js";
import { MqttSender } from "./protocols/mqtt.sender.js";
import { CoapSender } from "./protocols/coap.sender.js";
import { startSocketListener, setDeviceCommandHandler } from "./socket/socket.listener.js";
import { DeviceContext } from "./types.js";
import { ClosedLoopSimulation } from "./core/ClosedLoopSimulation.js";

// Enable closed-loop simulation mode (set to true to enable)
const ENABLE_CLOSED_LOOP_SIMULATION = true;

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
  const deviceSensorMap = new Map<string, number>(); // Map deviceUuid to sensorId

  for (const d of config.SensorDevices) {
    const ctx = await getDeviceToken(userToken, d.sensorId);
    devicesContext.push(ctx);
    deviceSensorMap.set(ctx.deviceUuid, d.sensorId);
  }
  

  const service = new TelemetryService(sender, deviceSensorMap);

  // Closed-loop simulation mode
  if (ENABLE_CLOSED_LOOP_SIMULATION) {
    console.log("🔄 Starting CLOSED-LOOP SIMULATION mode");
    console.log("📋 Flow: Send sensor data → Receive device commands → Update environment → Loop");

    // Initialize closed-loop simulation (initial values from config, no hardcoding)
    const simulation = new ClosedLoopSimulation(
      service,
      devicesContext,
      deviceSensorMap
    );

    // Set up device command handler
    setDeviceCommandHandler((command) => {
      simulation.processDeviceCommand(command);
    });

    // Start the simulation loop
    simulation.start(config.execution.delayMs || 5000);

    // Keep process alive
    process.on("SIGINT", () => {
      console.log("\n⏹️  Stopping simulation...");
      simulation.stop();
      process.exit(0);
    });
  } else {
    // Original mode (unchanged)
    while (true) {
      console.log("Executing telemetry for devices");
      console.log(`Waiting for next execution in ${config.execution.delayMs}ms`);
      if (config.execution.mode === "once") {
        console.log("Execution mode is once, exiting...");
        await service.execute(devicesContext);
        await new Promise((resolve) => setTimeout(resolve, config.execution.delayMs));
        break;
      }
      if (config.execution.mode === "loop") {
        await service.execute(devicesContext);
        await new Promise((resolve) => setTimeout(resolve, config.execution.delayMs));
        console.log(`Waiting for next execution in ${config.execution.delayMs}ms`);
      }
      if (config.execution.mode === "batch") {
        console.log("Execution mode is batch, executing batch...");
        await service.executeBatch(devicesContext);
        await new Promise((resolve) => setTimeout(resolve, config.execution.delayMs));
        console.log(`Waiting for next execution in ${config.execution.delayMs}ms`);
      }
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
