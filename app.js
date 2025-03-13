const express = require("express");
const path = require("path");
const { getSessionToken, getUserProfile } = require("./coapp_auth"); // Import the auth module

const PORT = 3000;
const app = express();

// Middleware
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// Coapp login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userToken = await getSessionToken(email, password);
    const userProfile = await getUserProfile(userToken.token);

    // TBC: Store token in Cookie?

    res.json(userProfile);

    // HERE!
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
