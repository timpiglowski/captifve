const axios = require("axios");

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
  console.log(`coapp_auth | Getting token for: ${email}`);

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

    console.log("Authentication successful!");
    console.log("Token:", token);

    return response.data;
  } catch (error) {
    console.error("Login error:", error.message);
    throw error; // Re-throw to be handled by the caller
  }
}

async function getUserPlan(token) {
  console.log(`Login attempt with token: ${token}`);

  try {
    const response = await axios.get(API_ENDPOINTS.plan, {
      headers: {
        ...API_CREDENTIALS.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("Getting plan successful!");
    return response.data.current.Plan.Name;
  } catch (error) {
    console.error("Token error:", error.message);
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
