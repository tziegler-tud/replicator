import fetch from 'node-fetch';
import db from '../schemes/mongo.js';
const Settings = db.Settings;

/**
 * @class
 * @constructor
 * Singleton
 */
class SettingsService {
    constructor(init = false) {
        let self = this;
        this.initStarted = false;
        this.status = this.statusEnum.NOTSTARTED;

        this.init = new Promise(function (resolve, reject) {
            self.resolveInit = resolve;
            self.rejectInit = reject;
        })

        this.debugLabel = "SettingsService: ";
        this.settings = undefined;
        this.settingsObject = {};
        this.defaultSettings = {
            debugLevel: 0
        }

        return this;
    }

    start(args){
        let self = this;
        this.initStarted = true;
        this.initFunc(args)
            .then(result => {
                self.status = self.statusEnum.RUNNING;
                self.resolveInit();
            })
            .catch(err => {
                self.status = self.statusEnum.FAILED;
                self.rejectInit();
            });
        return this.init;
    }

    initFunc(args) {
        let self = this;
        return new Promise(function (resolve, reject) {
            console.log("Loading settings...");
            let errMsg = "Failed to initialize SettingsService:";

            //try to load from db
            self.load()
                .then(result=> {
                    self.settings = result;
                    resolve(result)
                })
                .catch(err=> {
                    //failed to load settings from db. Create a fresh one and save it
                    self.create()
                        .then( result=> {
                            resolve(result);
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
        })
    }

    create(params) {
        let defaults = this.defaultSettings;
        params = Object.assign(defaults, params);
        params.identifier = params.identifier ? params.identifier : "Replicator-default-" + Date.now();
        let settings = new Settings(params)
        this.settings = settings;
        return settings.save()
    }

    save(){
        return this.settings.save();
    }

    load(){
        let self = this;
        return new Promise(function (resolve, reject) {
            //check known servers in db
            Settings.findOne()
                .then(function(settings) {
                    if(!settings){
                        //no file found
                        reject("No settings document found in database");
                    }
                    self.settings = settings;
                    self.settingsObject = settings._doc;
                    resolve(settings);
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    async getSettings() {
        await this.init;
        return this.settingsObject;
    }

    getSettingsSync(){
        if(this.status !== this.statusEnum.RUNNING) return {};
        return this.settingsObject;
    }

    async set({key, value}={}){
        if(!key) return false;
        this.settings[key] = value;
        await this.save();
        this.settingsObject = this.settings.doc;
        return this.settingsObject;
    }

    getLocalDate() {
        return new Date().toLocaleDateString();
    }

    getLocalDateTime() {
        return new Date().toLocaleString();
    }

    getLocalTime() {
        return new Date().toLocaleTimeString();
    }

    statusEnum = {
        NOTSTARTED: 0,
        RUNNING: 1,
        STOPPED: 2,
        FAILED: 3,
    }
}

export default new SettingsService();