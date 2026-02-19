const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

const TOKENS_DIR = path.join(process.cwd(), 'tokens');
const TOKENS_FILE = path.join(TOKENS_DIR, 'linkedin.json');

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

/**
 * Get the LinkedIn authorization URL
 */
function getAuthUrl() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.linkedin.clientId,
    redirect_uri: config.linkedin.redirectUri,
    scope: 'openid profile w_member_social',
    state: 'autodraft_' + Date.now(),
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
async function exchangeCodeForTokens(code) {
  try {
    const response = await axios.post(
      LINKEDIN_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: config.linkedin.clientId,
        client_secret: config.linkedin.clientSecret,
        redirect_uri: config.linkedin.redirectUri,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const tokenData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      created_at: Date.now(),
    };

    saveTokens(tokenData);
    logger.info('LinkedIn tokens obtained and saved');
    return tokenData;
  } catch (error) {
    logger.error('Failed to exchange code for tokens:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Save tokens to disk + log for env var backup
 */
function saveTokens(tokenData) {
  // Save to file (works locally; ephemeral on Render but OK for runtime)
  try {
    if (!fs.existsSync(TOKENS_DIR)) {
      fs.mkdirSync(TOKENS_DIR, { recursive: true });
    }
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokenData, null, 2));
  } catch (err) {
    logger.warn('Could not write token file (ephemeral FS?):', err.message);
  }

  // Log the token JSON so the user can copy it into LINKEDIN_TOKENS env var
  // This is critical for Render where filesystem is ephemeral
  logger.info('=== LINKEDIN_TOKENS (copy to env var for persistence) ===');
  logger.info(JSON.stringify(tokenData));
  logger.info('========================================================');

  // Cache in memory
  _tokenCache = tokenData;
}

// In-memory token cache (survives as long as process runs)
let _tokenCache = null;

/**
 * Load tokens from: memory cache → file → env var (in priority order)
 */
function loadTokens() {
  // 1. Memory cache (fastest)
  if (_tokenCache) return _tokenCache;

  // 2. File on disk
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const data = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf-8'));
      _tokenCache = data;
      return data;
    }
  } catch (error) {
    logger.warn('Could not read token file:', error.message);
  }

  // 3. Environment variable (for Render / ephemeral filesystems)
  if (config.linkedin.savedTokens) {
    try {
      const data = JSON.parse(config.linkedin.savedTokens);
      _tokenCache = data;
      logger.info('Loaded LinkedIn tokens from LINKEDIN_TOKENS env var');
      return data;
    } catch (error) {
      logger.error('Failed to parse LINKEDIN_TOKENS env var:', error.message);
    }
  }

  return null;
}

/**
 * Check if tokens are valid (not expired)
 */
function isTokenValid() {
  const tokens = loadTokens();
  if (!tokens) return false;

  const expiresAt = tokens.created_at + tokens.expires_in * 1000;
  // Consider expired 5 minutes before actual expiry
  return Date.now() < expiresAt - 5 * 60 * 1000;
}

/**
 * Refresh the access token
 */
async function refreshAccessToken() {
  const tokens = loadTokens();
  if (!tokens || !tokens.refresh_token) {
    throw new Error(`No refresh token available. Please re-authorize via ${config.appUrl}/auth/linkedin`);
  }

  try {
    const response = await axios.post(
      LINKEDIN_TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokens.refresh_token,
        client_id: config.linkedin.clientId,
        client_secret: config.linkedin.clientSecret,
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const tokenData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token || tokens.refresh_token,
      expires_in: response.data.expires_in,
      created_at: Date.now(),
    };

    saveTokens(tokenData);
    logger.info('LinkedIn tokens refreshed');
    return tokenData;
  } catch (error) {
    logger.error('Failed to refresh token:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get a valid access token (refresh if needed)
 */
async function getAccessToken() {
  if (!isTokenValid()) {
    const tokens = loadTokens();
    if (tokens && tokens.refresh_token) {
      await refreshAccessToken();
    } else {
      throw new Error(
        `LinkedIn not authorized. Visit ${config.appUrl}/auth/linkedin to authorize.`
      );
    }
  }
  return loadTokens().access_token;
}

/**
 * Get the logged-in user's profile (for author URN)
 */
async function getProfile() {
  const accessToken = await getAccessToken();

  try {
    const response = await axios.get(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    logger.info(`LinkedIn profile fetched: ${response.data.name}`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch LinkedIn profile:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a text post on LinkedIn
 */
async function createPost(text) {
  const accessToken = await getAccessToken();
  const profile = await getProfile();
  const authorUrn = `urn:li:person:${profile.sub}`;

  const postBody = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  try {
    const response = await axios.post(`${LINKEDIN_API_BASE}/ugcPosts`, postBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    logger.info(`LinkedIn post created successfully! ID: ${response.headers['x-restli-id']}`);
    return {
      success: true,
      postId: response.headers['x-restli-id'],
    };
  } catch (error) {
    logger.error('Failed to create LinkedIn post:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Setup Express routes for LinkedIn OAuth
 */
function setupOAuthRoutes(app) {
  app.get('/auth/linkedin', (req, res) => {
    const authUrl = getAuthUrl();
    res.redirect(authUrl);
  });

  app.get('/auth/linkedin/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
      logger.error('LinkedIn OAuth error:', error);
      return res.status(400).send(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>❌ Authorization Failed</h1>
            <p>${error}</p>
            <a href="/auth/linkedin">Try Again</a>
          </body>
        </html>
      `);
    }

    if (!code) {
      return res.status(400).send('No authorization code received.');
    }

    try {
      await exchangeCodeForTokens(code);
      res.send(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>✅ LinkedIn Authorized!</h1>
            <p>AutoDraft AI is now connected to your LinkedIn account.</p>
            <p>You can close this window and go back to Telegram.</p>
            ${config.isProduction ? '<p style="color: #666; font-size: 14px;">⚠️ Check server logs for the LINKEDIN_TOKENS value — add it to your Render env vars for persistence across deploys.</p>' : ''}
          </body>
        </html>
      `);
    } catch (err) {
      res.status(500).send(`
        <html>
          <body style="font-family: system-ui; padding: 40px; text-align: center;">
            <h1>❌ Error</h1>
            <p>${err.message}</p>
            <a href="/auth/linkedin">Try Again</a>
          </body>
        </html>
      `);
    }
  });

  app.get('/auth/status', (req, res) => {
    const valid = isTokenValid();
    res.json({
      authorized: valid,
      message: valid ? 'LinkedIn is connected' : `Not authorized. Visit ${config.appUrl}/auth/linkedin`,
    });
  });
}

module.exports = {
  getAuthUrl,
  exchangeCodeForTokens,
  isTokenValid,
  getProfile,
  createPost,
  setupOAuthRoutes,
  getAccessToken,
};
