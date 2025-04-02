const winston = require("winston");
const fs = require("fs");
const yaml = require("js-yaml");
const unifi = require("node-unifi");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// Function to load YAML file
function loadYamlFile(filename) {
  try {
    return yaml.load(fs.readFileSync(filename, "utf8"));
  } catch (error) {
    logger.error(`Failed to load ${filename}`, { error: error.message });
    process.exit(1);
  }
}

// Load configuration files
const configData = loadYamlFile("config.yaml");
const secretsData = loadYamlFile("secrets.yaml");

// Create UniFi controller instance
const controller = new unifi.Controller({
  hostname: configData.unifi_controller.ip,
  port: configData.unifi_controller.port,
  sslverify: false,
});

let isConnected = false;

// Connect to UniFi controller
async function connectToController() {
  try {
    await new Promise((resolve, reject) => {
      controller.login(
        secretsData.unifi_controller.username,
        secretsData.unifi_controller.password,
        (err) => (err ? reject(err) : resolve()),
      );
    });

    isConnected = true;
    logger.info("Connected to UniFi Controller");
    return true;
  } catch (error) {
    isConnected = false;
    logger.error(`Connection failed: ${error.message}`);
    // Rethrow the error instead of returning false
    throw error;
  }
}

// Authorize a client
async function authorizeClient(clientMac, minutes = 60, apMac = null) {
  if (!isConnected) {
    throw new Error("Not connected to UniFi controller");
  }

  try {
    await new Promise((resolve, reject) => {
      controller.authorizeGuest(clientMac, minutes, apMac, (err) =>
        err ? reject(err) : resolve(),
      );
    });

    logger.info(`Client ${clientMac} authorized successfully`);
    return true;
  } catch (error) {
    logger.error(`Failed to authorize client ${clientMac}: ${error.message}`);
    throw error;
  }
}

module.exports = { connectToController, authorizeClient };
