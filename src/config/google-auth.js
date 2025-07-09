const fs = require("fs");
const { google } = require("googleapis");
require("dotenv").config(); // asegúrate que está presente

const oauth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENT_ID,
  process.env.OAUTH_CLIENT_SECRET,
  process.env.OAUTH_REDIRECT
);

const TOKEN_PATH = "./_credentials/tokens.json";

if (fs.existsSync(TOKEN_PATH)) {
  const tokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oauth2Client.setCredentials(tokens);
}

function getAuthUrl() {
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // fuerza pedir permisos cada vez
    scope: ["https://www.googleapis.com/auth/drive.file"],
  });
}

async function getTokens(code) {
  const { tokens } = await oauth2Client.getToken(code);
  return tokens;
}

module.exports = {
  oauth2Client,
  getAuthUrl,
  getTokens,
};
