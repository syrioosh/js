const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path'); // For serving the React frontend

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

// Middleware for parsing application/json and application/x-www-form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

app.use('/api', async (req, res, next) => {
  // If we don't have a token or if it's expired, fetch it
  if (!token || new Date() > tokenExpiry) {
    try {
      const response = await axios.post(OAUTH_EP, {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'client_credentials'  // Service-to-service requests type
      });

      token = response.data.access_token;
      // Adjusting for a 5-second buffer to account for delays/inaccuracies
      tokenExpiry = new Date(new Date().getTime() + (response.data.expires_in - 5) * 1000);
    } catch (error) {
      return res.status(500).send("Failed to obtain token");
    }
  }

  // Set the authorization header for the request to the backend
  req.headers.authorization = `Bearer ${token}`;
  next();
});

// Proxy requests to BACKEND_URL
app.use('/api', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
  url: `${BACKEND_URL}${req.originalUrl.replace(/^\/api/, '')}`,
      headers: req.headers,
      data: req.body
    });

    // Forward headers from the original response
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response) {
      // The server responded with a status code outside of 2xx range
      Object.entries(error.response.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      res.status(error.response.status).send(error.response.data);
    } else {
      // An error occurred in setting up the request
      res.status(500).send(error.message || "Internal server error");
    }
  }
});

// Serve React frontend
app.use(express.static(path.join(__dirname, '..', 'ui', 'build')));

// Ensure client-side routing works
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'ui', 'build', 'index.html'));
});

app.listen(3000, () => {
  console.log(`Server is running on http://localhost:3000 in ${process.env.ENV} environment`);
});
