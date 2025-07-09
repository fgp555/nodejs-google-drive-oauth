require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const fs = require("fs");
const { google } = require("googleapis");
const { getAuthUrl, getTokens, oauth2Client } = require("./auth");

const app = express();
const PORT = process.env.PORT || 3000;
const TOKEN_PATH = "./_credentials/tokens.json";

app.use(morgan("dev"));
app.use(express.json());
app.use(express.static("public"));

async function getOrCreateFolder(drive, folderName) {
  // 🔍 Buscar carpeta existente
  const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
  const res = await drive.files.list({
    q: query,
    fields: "files(id, name)",
    spaces: "drive",
  });

  if (res.data.files.length > 0) {
    return res.data.files[0].id; // ✅ Ya existe
  }

  // 📁 Crear carpeta
  const folderMetadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };

  const folder = await drive.files.create({
    requestBody: folderMetadata,
    fields: "id",
  });

  return folder.data.id;
}

// 🔐 Inicio del login OAuth
app.get("/api/google-oauth/auth", (req, res) => {
  const url = getAuthUrl();
  res.redirect(url);
});

// 🔁 Callback OAuth
app.get("/api/google-oauth/callback", async (req, res) => {
  const { code } = req.query;
  try {
    const tokens = await getTokens(code);
    oauth2Client.setCredentials(tokens); // importante para uso inmediato
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens)); // 💾 Guardar en archivo
    res.send("✅ Login exitoso. <a href='/upload-test'>Subir archivo</a>");
  } catch (error) {
    console.error("❌ Error en callback:", error.message);
    res.status(500).send("Error al autenticar.");
  }
});

// 📤 Subir un archivo usando tokens del usuario
app.get("/api/google-drive/upload", async (req, res) => {
  console.log("📤 Subiendo archivo...");
  if (!fs.existsSync(TOKEN_PATH)) {
    return res.status(401).send("Primero inicia sesión en /auth");
  }

  const savedTokens = JSON.parse(fs.readFileSync(TOKEN_PATH));
  oauth2Client.setCredentials(savedTokens);

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  const filePath = "text.txt";
  const folderName = process.env.GOOGLE_DRIVE_FOLDER_NAME || "MyAppFolder";

  try {
    // ✅ Crear archivo si no existe
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "Contenido de ejemplo para subir a Google Drive.\n");
      console.log("📄 Archivo 'text.txt' creado.");
    }

    // ✅ Obtener o crear carpeta
    const folderId = await getOrCreateFolder(drive, folderName);

    // 📁 Subir archivo
    const fileMetadata = {
      name: "archivo-oauth.txt",
      parents: [folderId],
    };

    const media = {
      mimeType: "text/plain",
      body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, parents",
    });

    res.json({ message: "✅ Subido en carpeta", file: response.data });

    fs.unlinkSync(filePath);
    console.log("🗑️  Local file deleted");
  } catch (error) {
    console.error("❌ Error al subir:", error.message);
    res.status(500).send("Error al subir archivo");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
