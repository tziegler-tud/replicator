import Service from "./Service.js";
import child_process from "node:child_process";
import settingsConfig from '../config/config.json' with { type: 'json' };
import path from "path";
import db from '../schemes/mongo.js';
import CommunicationService from "./CommunicationService.js";
import LightsService from "./LightsService.js";
import SensorService from "./SensorService.js";
import SettingsService from "./SettingsService.js";
import fs from "fs";
const DbFiles = db.TtsFiles;



class TtsService extends Service {
    constructor() {
        super();
        /**
         *
         * @type {Sensor[]}
         */
        this.sensors = [];
        this.serviceName = "TtsService"
        this.piperPath = undefined;
        this.piperModel = undefined;
        this.outputPathRelative =  "data/out/tts/"
    }

    initFunc(args) {
        let self = this;
        return new Promise((resolve, reject)=>{
            console.log("Initializing TtsService...");
            //read settings from args
            if(!settingsConfig.tts) {
                reject("Invalid configuration.")
            }
            const tts = settingsConfig.tts;
            if(!tts.piperPath) {
                reject("Invalid configuration: Piper path is required.")
            }
            this.piperPath = tts.piperPath;

            if(!tts.piperModel) {
                reject("Invalid configuration: Piper model is required.")
            }
            this.piperModel = tts.piperModel;
            //verify piper is available and functional
            this.outPath = path.resolve(global.appRoot, this.outputPathRelative);
            // Example usage
            const uid = Date.now().toString();
            this._createAudioFile("LCARS startup complete. All systems functioning within normal parameters.", this.piperModel, this.outPath + "/startup-"+uid+".wav")
                .then(()=>resolve())
                .catch(err=>reject(err));
        })
    }

    /**
     *
     * @param {String} text
     * @return {DbFiles} filename
     */
    async _createAudio(text){
        const filename = "tts_"+Date.now().toString()+".wav";
        const created_file = await this._createAudioFile(text, this.piperModel, this.outPath + "/" + filename)
        return await this._createDbFile(filename, text)
    }

    async getAudio(text){
        const existing = await this._getDbFileByContent(text);
        if(existing !== null) {
            return existing.filename;
        }
        else {
            const file = await this._createAudio(text);
            return file.filename;
        }
    }

    _createAudioFile(text, model, outputFile) {
        return new Promise((resolve, reject) => {
            const piper = child_process.spawn(this.piperPath, ["--model", model, "--output_file", outputFile]);

            piper.stdin.write(text + "\n");
            piper.stdin.end();

            piper.on("close", (code) => {
                if (code === 0) {
                    resolve(outputFile);
                } else {
                    reject(new Error(`Piper process exited with code ${code}`));
                }
            });

            piper.on("error", (err) => {
                reject(err);
            });
        });
    }

    async _createDbFile(filename, content) {
        return await DbFiles.create({
            filename: filename,
            content: content
        })
    }

    async _deleteDbFile(id) {
        return DbFiles.findByIdAndDelete(id);
    }

    /**
     *
     * @param {String} content
     * @returns {Object|null}
     * @private
     */
    async _getDbFileByContent(content) {
        const result = await DbFiles.findOne({
            content: content
        })
        if (result) return result;
        else return null;
    }

    /**
     *
     * @param {String} filename
     * @returns {Object|null}
     * @private
     */
    async _getDbFileByFilename(filename) {
        const result = await DbFiles.findOne({
            filename: filename
        })
        if (result) return result;
        else return null;
    }

    /**
     *
     * @param {String} filename
     * @returns {String}
     */
    getFilePath(filename){
        return path.join(this.outPath, filename);
    }

    getFileNameFromPath(filePath){
        return path.basename(filePath)
    }

    getFileUrl(filename) {
        return CommunicationService.getHttpUrl() + "/stream/tts/" + filename;
    }

    /**
     *
     * @param {String} template
     */
    async resolveTemplate(template) {
        const variables = {
            entity: {
                light: arrayToObject(await LightsService.getLights(true)),
                lightScene: arrayToObject(await LightsService.getScenes(true)),
                lightGroup: arrayToObject(await LightsService.getGroups(true)),
                sensor: arrayToObject(SensorService.getSensors(true)),
            },
            client: {

            },
            system: {
                localDate: SettingsService.getLocalDate(),
                localDateTime: SettingsService.getLocalDateTime(),
                localTime: SettingsService.getLocalTime(),
                localTimeMilitary: this.getMilitaryTimeString(new Date()),
            },
        }
        return template.replace(/\{([^}]+)\}/g, (match, key) => {
            try {
                const value = key.split(".").reduce((obj, prop) => obj[prop], variables);
                return value !== undefined ? value : match; // Keep original if undefined
            } catch {
                return match; // Keep original if resolution fails
            }
        });

        function arrayToObject(array) {
            return array.reduce((acc, obj) => {
                acc[obj.uniqueId] = obj;
                return acc;
            }, {});
        }
    }

    getMilitaryTimeString(time){
        const d = new Date(time);
        let hours = d.getHours();
        let minutes = d.getMinutes();
        let timeString = "";
        if(hours < 10) {
            timeString = "o " + (hours*100 + minutes).toString() + " hours";
        }
        else {
            timeString = hours.toString() + " hundred" + minutes.toString() + " hours"
        }
        return timeString
    }
}

export default new TtsService();
