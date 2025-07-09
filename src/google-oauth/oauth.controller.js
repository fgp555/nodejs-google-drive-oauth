const fs = require("fs");
const { getAuthUrl, getTokens, oauth2Client } = require("../config/google-auth");
const authService = require("./oauth.service"); // ✅ usar AuthService

const TOKEN_PATH = "./_credentials/tokens.json";

class AuthController {
  authRedirect(req, res) {
    const url = getAuthUrl();
    res.redirect(url);
  }

  async oauth2Callback(req, res) {
    const { code } = req.query;

    try {
      const tokens = await getTokens(code);
      oauth2Client.setCredentials(tokens); // ⚡ uso inmediato
      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2)); // 💾 guardar

      res.send("✅ Login exitoso. <a href='/upload-test'>Subir archivo</a>");
    } catch (error) {
      console.error("❌ Error en callback:", error.message);
      res.status(500).send("Error al autenticar.");
    }
  }

  async checkToken(req, res) {
    try {
      const result = await authService.checkAccessToken(); // ✅ CORRECTO

      if (result.valid) {
        res.json({
          message: "✅ Token válido",
          user: result.user,
          tokenInfo: result.tokenInfo,
        });
      } else {
        res.status(401).json({
          error: "❌ Token inválido",
          details: result.error,
        });
      }
    } catch (err) {
      console.error("❌ Error al verificar token:", err.message);
      res.status(500).json({ error: "Error al verificar token" });
    }
  }

  async refreshToken(req, res) {
    try {
      const data = await authService.refreshAccessToken(); // ✅ CORRECTO
      res.json({ message: "🔄 Token actualizado", token: data });
    } catch (err) {
      res.status(500).send("Error al refrescar token");
    }
  }
}

const authController = new AuthController();
module.exports = { authController };
