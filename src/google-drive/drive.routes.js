const express = require("express");
const multer = require("../config/multer-config");
const { driveController } = require("./drive.controller");

const router = express.Router();

router.post("/upload", multer.single("file"), (req, res) => driveController.uploadFile(req, res));
router.post("/upload-from-url", (req, res) => driveController.uploadFromUrl(req, res));
router.get("/getAll", (req, res) => driveController.getAllFiles(req, res));
router.get("/preview/:fileId", (req, res) => driveController.getPreviewUrl(req, res));
router.get("/:fileId", (req, res) => driveController.getFileMetadata(req, res));
router.delete("/:fileId", (req, res) => driveController.deleteFile(req, res));
router.patch("/:fileId", (req, res) => driveController.renameFile(req, res));
module.exports = router;
