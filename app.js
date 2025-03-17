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

let allowedPlans = "";

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
  res.sendFile(path.join(__dirname, "public", "login.html"));

  const clientMac = req.query.mac;

  if (!clientMac) {
    logger.error("Received no MAC adress", { mac: clientMac });
    return res.status(400).send("MAC address is required");
  }
  if (!isValidMACAddress(clientMac)) {
    logger.error("Received invalid MAC adress", { mac: clientMac });
    return res.status(400).send("Invalid MAC adress format");
  }
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

    try {
      const fileContents = fs.readFileSync("config.yaml", "utf8");
      const data = yaml.load(fileContents);

      allowedPlans = data.allowed_plans;
      logger.info("Retrieved allowed plans.", { plans: allowedPlans });
    } catch (error) {
      console.log(error);
    }

    res.redirect("/success");
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
