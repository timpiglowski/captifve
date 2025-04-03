const axios = require("axios");
const { config, secrets, logger } = require("./config");

// Configuration constants
const API_CREDENTIALS = {
  headers: {
    "x-app-id": secrets.coapp_credentials.x_app_id,
    "x-app-secret": secrets.coapp_credentials.x_app_secret,
  },
};

const API_ENDPOINTS = {
  login: "https://api.coapp.io/v1/user/loginV2",
  plan: "https://api.coapp.io/v1/me/plan",
};

async function getAuthToken(email, password) {
  logger.info("Authenticating user with Coapp", { email });
  try {
    const response = await axios.post(
      API_ENDPOINTS.login,
      { email, password },
      API_CREDENTIALS,
    );
    logger.info("Coapp authentication successful", { email });
    return response.data;
  } catch (error) {
    const statusCode = error.response?.status || "unknown";
    logger.error("Coapp authentication failed", {
      email,
      statusCode,
      errorMessage: error.message,
    });
    throw error;
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
    logger.info("Receiving profile successful!");
    return response.data.current.Plan.Name;
  } catch (error) {
    logger.error(
      "An error occurred while trying to get the profile",
      error.message,
    );
    throw error;
  }
}

// Export functions
module.exports = {
  getAuthToken,
  getUserPlan,
};
