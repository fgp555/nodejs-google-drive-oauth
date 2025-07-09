const { google } = require("googleapis");

const oauth2Client = new google.auth.OAuth2({
  clientId: process.env.OAUTH_CLIENT_ID,
  clientSecret: process.env.OAUTH_CLIENT_SECRET,
  redirectUri: process.env.OAUTH_REDIRECT,
});

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

async function getTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  return tokens;
}

module.exports = { oauth2Client, getAuthUrl, getTokens };
