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
    console.error("Failed to load configuration", error);
    process.exit(1);
  }
}

module.exports = loadConfig();
