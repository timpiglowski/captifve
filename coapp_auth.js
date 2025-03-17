const axios = require("axios");

const winston = require("winston");

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// Configuration constants
const API_CREDENTIALS = {
  headers: {
    "X-APP-ID": "***REMOVED***",
    "X-APP-SECRET": "***REMOVED***",
  },
};

const API_ENDPOINTS = {
  login: "https://api.coapp.io/v1/user/loginV2",
  plan: "https://api.coapp.io/v1/me/plan",
};

async function getAuthToken(email, password) {
  logger.info("Getting token...", { email: email });

  try {
    const response = await axios.post(
      API_ENDPOINTS.login,
      {
        email,
        password,
      },
      API_CREDENTIALS,
    );

    const token = response.data.token;

    logger.info("Coapp authentication sucesful!", { email: email });

    return response.data;
  } catch (error) {
    logger.error(
      "An error occured while trying to authenticate the user with Coapp",
      error.message,
    );
    throw error; // Re-throw to be handled by the caller
  }
}

async function getUserPlan(token) {
  logger.info("Getting profile with token...", { token: token });

  try {
    const response = await axios.get(API_ENDPOINTS.plan, {
      headers: {
        ...API_CREDENTIALS.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    logger.info("Receiving profile sucesful!");
    return response.data.current.Plan.Name;
  } catch (error) {
    logger.error(
      "An error occured while trying to get the profile",
      error.message,
    );
    throw error; // Re-throw to be handled by the caller
  }
}

// Export constants and functions
module.exports = {
  API_CREDENTIALS,
  API_ENDPOINTS,
  getAuthToken,
  getUserPlan,
};
