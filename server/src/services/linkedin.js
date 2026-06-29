const axios = require('axios');
const config = require('../config');
const logger = require('../utils/logger');
const db = require('../db');

const LINKEDIN_AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
const LINKEDIN_TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
const LINKEDIN_API_BASE = 'https://api.linkedin.com/v2';
const LINKEDIN_USERINFO_URL = 'https://api.linkedin.com/v2/userinfo';

/**
 * Get the LinkedIn authorization URL for a specific user
 */
function getAuthUrl(userId) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.linkedin.clientId,
    redirect_uri: config.linkedin.redirectUri,
    scope: 'openid profile w_member_social w_organization_social r_organization_social',
    state: `tacodraft_user_${userId}_${Date.now()}`,
  });
  return `${LINKEDIN_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens and save for user
 */
async function exchangeCodeForTokens(userId, code) {
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
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const User = require('../models/User');

    // Fetch LinkedIn user ID (sub)
    const profileResponse = await axios.get(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${response.data.access_token}` },
    });
    const linkedinId = profileResponse.data.sub;

    if (linkedinId) {
      const existingUser = await User.findOne({ linkedin_id: linkedinId });
      if (existingUser && String(existingUser._id) !== String(userId)) {
        throw new Error('This LinkedIn profile is already connected to another TacoDraft account.');
      }
      await User.updateOne({ _id: userId }, { $set: { linkedin_id: linkedinId } });
    }

    const tokenData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token,
      expires_in: response.data.expires_in,
      created_at: Date.now(),
    };

    await db.saveLinkedInTokens(userId, tokenData);
    logger.info(`LinkedIn tokens obtained for user ${userId}`);
    return tokenData;
  } catch (error) {
    logger.error(`Failed to exchange code for user ${userId}: ${JSON.stringify(error.response?.data) || error.message}`);
    throw error;
  }
}

/**
 * Refresh the access token for a user
 */
async function refreshAccessToken(userId) {
  const tokens = await db.getLinkedInTokens(userId);
  if (!tokens || !tokens.refresh_token) {
    throw new Error(`No refresh token for user ${userId}. Please re-authorize.`);
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
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const tokenData = {
      access_token: response.data.access_token,
      refresh_token: response.data.refresh_token || tokens.refresh_token,
      expires_in: response.data.expires_in,
      created_at: Date.now(),
    };

    await db.saveLinkedInTokens(userId, tokenData);
    logger.info(`LinkedIn tokens refreshed for user ${userId}`);
    return tokenData;
  } catch (error) {
    logger.error(`Failed to refresh token for user ${userId}: ${JSON.stringify(error.response?.data) || error.message}`);
    throw error;
  }
}

/**
 * Get a valid access token for a user
 */
async function getAccessToken(userId) {
  const valid = await db.isLinkedInTokenValid(userId);
  if (!valid) {
    const tokens = await db.getLinkedInTokens(userId);
    if (tokens && tokens.refresh_token) {
      await refreshAccessToken(userId);
    } else {
      throw new Error('LinkedIn not authorized. Use /linkedin to connect your account.');
    }
  }
  const tokens = await db.getLinkedInTokens(userId);
  return tokens.access_token;
}

/**
 * Get the logged-in user's LinkedIn profile
 */
async function getProfile(userId) {
  const accessToken = await getAccessToken(userId);
  try {
    const response = await axios.get(LINKEDIN_USERINFO_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch LinkedIn profile for user ${userId}: ${JSON.stringify(error.response?.data) || error.message}`);
    throw error;
  }
}

/**
 * Create a text post on LinkedIn for a specific user
 */
async function createPost(userId, text) {
  const accessToken = await getAccessToken(userId);
  const user = await db.getUserById(userId);

  let authorUrn;
  let postTarget;

  if (user && user.linkedin_org_id) {
    authorUrn = `urn:li:organization:${user.linkedin_org_id}`;
    postTarget = `Organization Page (ID: ${user.linkedin_org_id})`;
  } else {
    const profile = await getProfile(userId);
    authorUrn = `urn:li:person:${profile.sub}`;
    postTarget = `Personal Profile (${profile.name})`;
  }

  logger.info(`User ${userId} posting to: ${postTarget}`);

  const postBody = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text },
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

    let postId = response.headers['x-restli-id'];
    
    // We must return the raw URN (e.g. urn:li:share:ID or urn:li:ugcPost:ID). 
    // LinkedIn handles these properly in the feed/update URL and redirects to the activity automatically.

    logger.info(`LinkedIn post for user ${userId} on ${postTarget}! ID: ${postId}`);
    return { success: true, postId, target: postTarget };
  } catch (error) {
    logger.error(`Failed to create LinkedIn post for user ${userId}: ${JSON.stringify(error.response?.data) || error.message}`);
    throw error;
  }
}

/**
 * Fetch analytics (likes and comments) for a specific post
 */
async function getPostAnalytics(userId, urn) {
  try {
    const accessToken = await getAccessToken(userId);
    // Fetch social actions
    const response = await axios.get(`${LINKEDIN_API_BASE}/socialActions/${encodeURIComponent(urn)}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    });

    return {
      likes: response.data?.likesSummary?.totalLikes || 0,
      comments: response.data?.commentsSummary?.totalFirstDegreeComments || 0, // Sometimes it's totalFirstDegreeComments or just comments
    };
  } catch (error) {
    logger.warn(`Could not fetch analytics for ${urn}: ${error.response?.data?.message || error.message}`);
    // If scope issues or post deleted, return 0
    return { likes: 0, comments: 0 };
  }
}

/**
 * Setup Express routes for LinkedIn OAuth (multi-user)
 */
function setupOAuthRoutes(app) {
  app.get('/auth/linkedin', (req, res) => {
    const userId = req.query.user;
    if (!userId) {
      return res.status(400).send(`
        <html><body style="font-family:system-ui;padding:40px;text-align:center;">
          <h1>⚠️ Missing user ID</h1>
          <p>Use the link from Telegram to authorize.</p>
        </body></html>
      `);
    }
    const authUrl = getAuthUrl(userId);
    res.redirect(authUrl);
  });

  app.get('/auth/linkedin/callback', async (req, res) => {
    const { code, error, state } = req.query;

    if (error) {
      return res.status(400).send(`
        <html><body style="font-family:system-ui;padding:40px;text-align:center;">
          <h1>❌ Authorization Failed</h1><p>${error}</p>
        </body></html>
      `);
    }

    // Extract userId from state: tacodraft_user_<userId>_<timestamp>
    const stateMatch = state && state.match(/tacodraft_user_([a-f0-9]+)_/);
    const userId = stateMatch ? stateMatch[1] : null;

    if (!code || !userId) {
      return res.status(400).send('Invalid callback: missing code or user ID.');
    }

    try {
      await exchangeCodeForTokens(userId, code);
      res.send(`
        <html><body style="font-family:system-ui;padding:40px;text-align:center;">
          <h1>✅ LinkedIn Connected!</h1>
          <p>You can now close this tab and go back to your TacoDraft dashboard to schedule your posts.</p>
          <script>
            setTimeout(() => {
              window.close();
            }, 3000);
          </script>
        </body></html>
      `);
    } catch (err) {
      res.status(500).send(`
        <html><body style="font-family:system-ui;padding:40px;text-align:center;">
          <h1>❌ Error</h1><p>${err.message}</p>
        </body></html>
      `);
    }
  });

  app.get('/auth/status', async (req, res) => {
    const userId = req.query.user;
    if (!userId) return res.json({ error: 'Missing user query param' });
    const valid = await db.isLinkedInTokenValid(userId);
    res.json({ authorized: valid });
  });
}

module.exports = {
  getAuthUrl,
  exchangeCodeForTokens,
  getAccessToken,
  getProfile,
  createPost,
  getPostAnalytics,
  setupOAuthRoutes,
};
