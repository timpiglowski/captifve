const express = require("express");
const path = require("path");
const { config, secrets, logger } = require("./config");
const { getAuthToken, getUserPlan } = require("./coapp_auth");
const { connectToController, authorizeClient } = require("./unifi");

const PORT = 3000;
const app = express();

// Get allowed plans from the loaded config
const allowedPlans = Array.from(config.allowed_plans);
logger.info("Retrieved allowed plans.", { plans: allowedPlans });

// Validation function
// Define Regex outside of function for better performance
const MAC_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

function isValidMACAddress(mac) {
  return MAC_REGEX.test(mac);
}

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  // Helper function to validate MAC addresses
  const validateMac = (type, value) => {
    if (!value) {
      logger.error(`Received no ${type} MAC address`, { mac: req.query.mac });
      res.status(400).send(`${type} MAC address is required`);
      return false;
    }

    if (!isValidMACAddress(value)) {
      logger.error(`Received invalid ${type} MAC address`, {
        mac: req.query.mac,
      });
      res.status(400).send(`Invalid ${type} MAC address format`);
      return false;
    }

    return true;
  };

  // Check both MAC addresses
  if (
    !validateMac("CLIENT", req.query.mac) ||
    !validateMac("AP", req.query.ap)
  ) {
    return;
  }

  res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.get("/success", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "success.html"));
});

// Membership Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const clientMac = req.query.mac;
  const apMac = req.query.ap;

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

/*
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
    });*/
