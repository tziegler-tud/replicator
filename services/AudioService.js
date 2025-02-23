import Service from "./Service.js";
import child_process from "node:child_process";
import settingsConfig from '../config/config.json' assert { type: 'json' };
import path from "path";
import fs from "fs";



class AudioService extends Service {
    constructor() {
        super();
        /**
         *
         * @type {Sensor[]}
         */
        this.sensors = [];
        this.name = "TtsService"
        this.piperPath = undefined;
        this.piperModel = undefined;
        this.relativePath =  "data/audio/";
        this.audioPath = undefined;
        this.files = [];
    }

    initFunc(args) {
        let self = this;
        return new Promise((resolve, reject)=>{
            console.log("Initializing Audio Service...");
            this.audioPath = path.resolve(global.appRoot, this.relativePath);
            if (!fs.existsSync(this.audioPath)) {
                reject("Audio directory does not exist or is not readable.")
            }
            fs.promises.readdir(this.audioPath)
                .then(files => {
                    this.files = files;
                    resolve();
                })
                .catch(err=>{
                    reject("Error reading audio directory: " + err);
                })
        })
    }

    /**
     *
     * @param {String} filename
     * @returns {String}
     */
    getFilePath(filename){
        return path.join(this.audioPath, filename);
    }

    getFiles(){
        return this.files;
    }
}

export default new AudioService();
