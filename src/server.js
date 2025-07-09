const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");

const driveRoutes = require("./google-drive/drive.routes");
const oauthRoutes = require("./google-oauth/oauth.routes");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.static("public"));

app.use("/api/google-oauth", oauthRoutes);
app.use("/api/google-drive", driveRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
