const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment configuration based on NODE_ENV
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env';
dotenv.config({ path: envFile });

const OAUTH_EP = process.env.OAUTH_EP;
const BACKEND_URL = process.env.BACKEND_URL;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

let token = null;
let tokenExpiry = null;

const app = express();

app.use(async (req, res, next) => {
  // If we don't have a token or if it's expired, fetch it
  if (!token || new Date() > tokenExpiry) {
    try {
      const response = await axios.post(OAUTH_EP, {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        // ... any other needed OAuth params
        grant_type: 'client_credentials'  // This is often the type for service-to-service requests
      });

      token = response.data.access_token;

      // Adjusting for a 5-second buffer to account for any delays or inaccuracies
      tokenExpiry = new Date(new Date().getTime() + (response.data.expires_in - 5) * 1000);
    } catch (error) {
      return res.status(500).send("Failed to obtain token");
    }
  }

  // Set the authorization header for the request to the backend
  req.headers.authorization = `Bearer ${token}`;
  next();
});

// Proxy all requests to BACKEND_URL
app.use('/', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `${BACKEND_URL}${req.url}`,
      headers: req.headers,
      data: req.body
    });
    res.send(response.data);
  } catch (error) {
    res.status(500).send(error.message || "Internal server error");
  }
});

app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000 in ${process.env.ENV} environment`);
});
