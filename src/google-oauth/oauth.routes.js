const express = require("express");
const { authController } = require("./oauth.controller");

const router = express.Router();

router.get("/auth", (req, res) => authController.authRedirect(req, res));
router.get("/callback", (req, res) => authController.oauth2Callback(req, res));
router.get("/refresh-token", (req, res) => authController.refreshToken(req, res));
router.get("/check-token", (req, res) => authController.checkToken(req, res));

module.exports = router;
