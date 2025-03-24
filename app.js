const express = require("express");
const path = require("path");
const fs = require("fs");
const yaml = require("js-yaml");
const { getAuthToken, getUserPlan } = require("./coapp_auth"); // Import the auth module

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
  const clientMac = req.query.mac;

  if (!clientMac) {
    logger.error("Received no MAC address", { mac: clientMac });
    return res.status(400).send("MAC address is required");
  }
  if (!isValidMACAddress(clientMac)) {
    logger.error("Received invalid MAC address", { mac: clientMac });
    return res.status(400).send("Invalid MAC address format");
  }

  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "success.html"));
});

// Coapp login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userToken = await getAuthToken(email, password);
    const userPlan = await getUserPlan(userToken.token);

    logger.info("Received plan", { plan: userPlan });

    if (allowedPlans.includes(userPlan)) {
      res.redirect("/success");
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
  console.log(`Captive portal running on port ${PORT}`);
});
