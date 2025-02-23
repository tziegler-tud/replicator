import express from 'express';
import TtsService from '../../services/TtsService.js';
import fs from "fs";
import AudioService from "../../services/AudioService.js";
var router = express.Router();

//router for client interaction
/* hooked at /stream */
router.get("/tts/:filename", getTtsFile);
router.get("/audio/:filename", getAudioFile);

function getTtsFile(req, res, next) {
    const filename = req.params.filename;
    const path = TtsService.getFilePath(filename);

    if (!fs.existsSync(path)) {
        return res.status(404).json({ error: "File not found" });
    }
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    const readStream = fs.createReadStream(path);
    readStream.pipe(res);

    readStream.on("error", (err) => {
        console.error("File Stream Error:", err);
        res.status(500).send("Internal Server Error");
    });
}

function getAudioFile(req, res, next) {
    const filename = req.params.filename;
    const path = AudioService.getFilePath(filename);
    if (!fs.existsSync(path)) {
        return res.status(404).json({ error: "File not found" });
    }
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);

    const readStream = fs.createReadStream(path);
    readStream.pipe(res);

    readStream.on("error", (err) => {
        console.error("File Stream Error:", err);
        res.status(500).send("Internal Server Error");
    });
}


export default router