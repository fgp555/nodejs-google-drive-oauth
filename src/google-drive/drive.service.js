const fs = require("fs");
const { google } = require("googleapis");
const { oauth2Client } = require("../config/google-auth");
require("dotenv").config(); // 👈 Asegúrate de incluir esto

const FOLDER_NAME = process.env.GOOGLE_DRIVE_FOLDER_NAME;

class DriveService {
  constructor() {
    this.drive = google.drive({ version: "v3", auth: oauth2Client });
  }

  async getOrCreateFolder() {
    const query = `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`;

    const res = await this.drive.files.list({
      q: query,
      fields: "files(id)",
      spaces: "drive",
    });

    if (res.data.files.length > 0) {
      return res.data.files[0].id;
    }

    const folderMetadata = {
      name: FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
    };

    const folder = await this.drive.files.create({
      requestBody: folderMetadata,
      fields: "id",
    });

    return folder.data.id;
  }

  async listFiles() {
    const folderId = await this.getOrCreateFolder(); // 👈 Usamos la carpeta configurada

    const res = await this.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      pageSize: 100,
      fields: "files(id, name, mimeType, size, createdTime, modifiedTime)",
    });

    return res.data.files;
  }

  async uploadFile({ filePath, originalName, mimeType, name, description }) {
    const folderId = await this.getOrCreateFolder(); // 👈 Obtener carpeta primero

    const fileMetadata = {
      name: name || originalName,
      description: description || "",
      parents: [folderId], // 👈 Guardar en carpeta
    };

    const media = {
      mimeType,
      body: fs.createReadStream(filePath),
    };

    const response = await this.drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: "id, name, parents",
    });

    return response.data;
  }

  async getFileMetadata(fileId) {
    const res = await this.drive.files.get({
      fileId,
      fields: "id, name, mimeType, size, createdTime, modifiedTime, webViewLink",
    });
    return res.data;
  }

  async deleteFile(fileId) {
    await this.drive.files.delete({ fileId });
  }

  async renameFile(fileId, newName) {
    const res = await this.drive.files.update({
      fileId,
      requestBody: { name: newName },
      fields: "id, name",
    });
    return res.data;
  }
}

const driveService = new DriveService();
module.exports = { driveService };
