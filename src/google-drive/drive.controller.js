const fs = require("fs");
const path = require("path");
const { pipeline } = require("stream");
const { promisify } = require("util");
const streamPipeline = promisify(pipeline);
const { driveService } = require("./drive.service");

class DriveController {
  async getAllFiles(req, res) {
    try {
      const files = await driveService.listFiles();
      res.json({ message: "📄 Lista de archivos", files });
    } catch (err) {
      console.error("❌ Error al listar archivos:", err.message);
      res.status(500).send("Error al obtener archivos");
    }
  }

  async uploadFile(req, res) {
    if (!req.file) return res.status(400).send("Falta archivo");

    const { name, description } = req.body;

    try {
      const result = await driveService.uploadFile({
        filePath: req.file.path,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        name,
        description,
      });

      fs.unlinkSync(req.file.path); // eliminar archivo temporal

      res.json({ message: "✅ Archivo subido", file: result });
    } catch (err) {
      console.error("❌ Error al subir archivo:", err.message);
      res.status(500).send("Error al subir archivo");
    }
  }

  async uploadFromUrl(req, res) {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: "⚠️ Falta 'url' en el cuerpo" });

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`❌ Fallo al descargar archivo: ${response.statusText}`);

      // 🧾 Extraer nombre y tipo
      const fileName = path.basename(new URL(url).pathname);
      const mimeType = response.headers.get("content-type") || "application/octet-stream";

      // 📁 Ruta destino
      const uploadsDir = path.join(__dirname, "../../uploads");
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

      const tempPath = path.join(uploadsDir, fileName);

      // 💾 Guardar archivo temporal
      await streamPipeline(response.body, fs.createWriteStream(tempPath));

      // 📤 Subir a Google Drive
      const result = await driveService.uploadFile({
        filePath: tempPath,
        originalName: fileName,
        mimeType,
      });

      // 🧹 Limpiar archivo temporal
      fs.unlinkSync(tempPath);

      res.json({ message: "✅ Archivo descargado y subido", file: result });
    } catch (err) {
      console.error("❌ Error al subir desde URL:", err);
      res.status(500).json({ error: "Error al subir archivo desde URL" });
    }
  }

  async getFileMetadata(req, res) {
    const { fileId } = req.params;

    try {
      const metadata = await driveService.getFileMetadata(fileId);
      res.json({ message: "📄 Metadata obtenida", metadata });
    } catch (err) {
      console.error("❌ Error al obtener metadata:", err.message);
      res.status(500).send("Error al obtener metadata");
    }
  }

  async deleteFile(req, res) {
    const { fileId } = req.params;

    try {
      await driveService.deleteFile(fileId);
      res.json({ message: "🗑️ Archivo eliminado correctamente" });
    } catch (err) {
      console.error("❌ Error al eliminar archivo:", err.message);
      res.status(500).send("Error al eliminar archivo");
    }
  }

  async renameFile(req, res) {
    const { fileId } = req.params;
    const { name } = req.body;

    if (!name) return res.status(400).send("Falta 'name' en el body");

    try {
      const updated = await driveService.renameFile(fileId, name);
      res.json({ message: "✏️ Archivo renombrado", updated });
    } catch (err) {
      console.error("❌ Error al renombrar:", err.message);
      res.status(500).send("Error al renombrar archivo");
    }
  }

  async getPreviewUrl(req, res) {
    const { fileId } = req.params;

    try {
      const url = `https://drive.google.com/file/d/${fileId}/preview`;
      res.json({ previewUrl: url });
    } catch (err) {
      res.status(500).send("Error al generar preview URL");
    }
  }
}

const driveController = new DriveController();
module.exports = { driveController };
