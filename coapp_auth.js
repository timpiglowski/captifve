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
  profile: "https://api.coapp.io/v1/dashboard/me",
};

/**
 * Authenticates a user with Coapp API
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Promise resolving to authentication response
 */
async function authenticateUser(email, password) {
  console.log(`Login attempt for user: ${email}`);

  try {
    const response = await axios.post(
      API_ENDPOINTS.login,
      {
        email,
        password,
      },
      API_CREDENTIALS,
    );

    // Extract the token from the response
    const token = response.data.token;

    // Log the token to the console
    console.log("Authentication successful!");
    console.log("Token:", token);

    return response.data;
  } catch (error) {
    console.error("Login error:", error.message);
    throw error; // Re-throw to be handled by the caller
  }
}

// Export constants and functions
module.exports = {
  API_CREDENTIALS,
  API_ENDPOINTS,
  authenticateUser,
};
