const fs = require("fs");
const { google } = require("googleapis");
const { oauth2Client } = require("../config/google-auth");

class AuthService {
  constructor() {
    this.drive = google.drive({ version: "v3", auth: oauth2Client });
  }

  async checkAccessToken() {
    try {
      const res = await this.drive.about.get({ fields: "user" });

      const tokens = oauth2Client.credentials;

      const accessTokenExpiry = new Date(tokens.expiry_date);
      const refreshTokenExpiresIn = tokens.refresh_token_expires_in || null;

      return {
        valid: true,
        user: res.data.user,
        tokenInfo: {
          access_token_expiry_date: accessTokenExpiry.toLocaleString(),
          refresh_token_expires_in_days: refreshTokenExpiresIn ? Math.floor(refreshTokenExpiresIn / 86400) : null,
          raw_expiry_timestamp: tokens.expiry_date,
        },
      };
    } catch (err) {
      console.error("❌ Token inválido:", err.message);
      return { valid: false, error: err.message };
    }
  }

  async refreshAccessToken() {
    try {
      const { token } = await oauth2Client.getAccessToken();
      const tokens = oauth2Client.credentials;

      // Guardar token actualizado
      fs.writeFileSync("./_credentials/tokens.json", JSON.stringify(tokens, null, 2));

      return {
        access_token: token,
        expiry_date: tokens.expiry_date,
      };
    } catch (err) {
      console.error("❌ Error al refrescar token:", err.message);
      throw new Error("No se pudo refrescar el token");
    }
  }
}

module.exports = new AuthService();
