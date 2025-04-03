const fs = require("fs");
const yaml = require("js-yaml");
const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

function loadConfig() {
  try {
    const config = yaml.load(fs.readFileSync("config.yaml", "utf8"));
    const secrets = yaml.load(fs.readFileSync("secrets.yaml", "utf8"));
    return { config, secrets, logger };
  } catch (error) {
    logger.error("Failed to load configuration files", {
      error: error.message,
      stack: error.stack,
    });
    throw new Error(`Configuration loading failed: ${error.message}`);
  }
}

module.exports = loadConfig();
