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

const { ip: controller_ip, port: controller_port } =
  configData.unifi_controller;
const { username: controller_username, password: controller_password } =
  secretsData.unifi_controller;

// Connect to UniFi Controller
const controller = new unifi.Controller({
  controller_ip,
  controller_port,
  sslverify: false,
});

controller.login(controller_username, controller_password, function (err) {
  if (err) {
    logger.error("Failed to connect to UniFi controller!", {
      error: err.message,
    });
    return;
  }
  logger.info("Connected to UniFi Controller successfully.");
});
