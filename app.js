const express = require("express");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const { getAuthToken, getUserPlan } = require("./coapp_auth"); // Import the auth module
const { connectToController, authorizeClient } = require("./unifi"); // Import custom unifi module

const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

const PORT = process.env.PORT || 3000;
const app = express();

// Allowed plans from config
let allowedPlans;

try {
  const fileContents = fs.readFileSync("config.yaml", "utf8");
  const data = yaml.load(fileContents);
  allowedPlans = Array.from(data.allowed_plans);
  logger.info("Retrieved allowed plans.", { plans: allowedPlans });
} catch (error) {
  logger.error("Failed to load configuration", { error: error.message });
  process.exit(1); // Exit if critical configuration is missing
}

// Validation Functions
function isValidMACAddress(mac) {
  const regex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
  return regex.test(mac);
}

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  // TODO: This needs restructuring
  // TODO: Implement location checking

  // Parse CLIENT MAC
  const clientMac = req.query.mac;

  if (!clientMac) {
    logger.error("Received no CLIENT MAC address", { mac: clientMac });
    return res.status(400).send("CLIENT MAC address is required");
  }
  if (!isValidMACAddress(clientMac)) {
    logger.error("Received invalid CLIENT MAC address", { mac: clientMac });
    return res.status(400).send("Invalid CLIENT MAC address format");
  }

  // Parse AP MAC
  const apMac = req.query.ap;

  if (!apMac) {
    logger.error("Received no AP MAC address", { mac: clientMac });
    return res.status(400).send("AP MAC address is required");
  }
  if (!isValidMACAddress(apMac)) {
    logger.error("Received invalid AP MAC address", { mac: clientMac });
    return res.status(400).send("Invalid AP MAC address format");
  }

  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "success.html"));
});

// Membership Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // CoApp Login
  try {
    const userToken = await getAuthToken(email, password);
    const userPlan = await getUserPlan(userToken.token);

    logger.info("Received plan", { plan: userPlan });

    if (allowedPlans.includes(userPlan)) {
      // Authorize client in UniFi
      try {
        await authorizeClient(clientMac, 60, apMac);
        res.redirect("/success");
      } catch (error) {
        logger.error("Couldn't authenticate client!");
        res.status(500).json({ error: "Internal server error" });
      }
    } else {
      logger.warn("Blocked unauthorized user", { plan: userPlan });
      res.status(401).send("Unauthorized");
    }
  } catch (error) {
    if (error.response) {
      res.status(error.response.status).json({
        error: "Authentication failed",
        details: error.response.data,
      });
    } else if (error.request) {
      res.status(503).json({ error: "Service unavailable" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Start server
app.listen(PORT, () => {
  logger.info(`Captive portal running on port ${PORT}`);
});

// Connect to UniFi controller

connectToController()
  .then(() => {
    logger.info("Connected to UniFi controller");
  })
  .catch((error) => {
    logger.error("Failed to connect to UniFi controller", {
      error: error.message,
    });
    process.exit(1);
  });
