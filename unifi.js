const unifi = require("node-unifi");
const { config, secrets, logger } = require("./config");

// Create UniFi controller instance
const controller = new unifi.Controller({
  hostname: config.unifi_controller.ip,
  port: config.unifi_controller.port,
  sslverify: false,
});

let isConnected = false;

// Connect to UniFi controller
async function connectToController() {
  try {
    await new Promise((resolve, reject) => {
      controller.login(
        secrets.unifi_controller.username,
        secrets.unifi_controller.password,
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
