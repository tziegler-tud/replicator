import SettingsService from "./SettingsService.js";
import LogService from "./LogService.js";
/**
 * @class
 * @abstract
 * Abstract Service class.
 * Implementations of this class should expose a singleton instance to the app, useable by imports.
 * Module export of such a class should be a new instance.
 */
export default class Service {
    constructor(){
        let self = this;
        this.initStarted = false;
        this.status = this.statusEnum.NOTSTARTED;

        this.init = new Promise(function (resolve, reject) {
            self.resolveInit = resolve;
            self.rejectInit = reject;
        })

        this.serviceName = "Service"
        this.enableDebug = true;
        this.globalSettings = {};
    }

    debug(message, level=1) {
        if(this.globalSettings.system.debugLevel <= level) console.log(this.serviceName + ": " + message);
    }

    log(type, content){
        return LogService.addLogEntry(type, content);
    }

    /**
     * start the service
     * @param args {Object} Arguments object forwarded to the initialization function.
     */
    start(args){
        let self = this;
        this.initStarted = true;
        SettingsService.getSettings()
            .then(settings => {
                self.globalSettings = settings;
                console.log("Starting service: " + this.serviceName);
                this.initFunc(args)
                    .then(result => {
                        self.status = self.statusEnum.RUNNING;
                        self.resolveInit(this);
                    })
                    .catch(err => {
                        self.status = self.statusEnum.FAILED;
                        self.rejectInit(this);
                    });
            })
            .catch(e => {
                self.rejectInit(this);
            })
        return this.init;

    }

    /**
     * stops the service
     */
    stop(){
        this.stopService()
            .then(()=>{
                this.status = this.statusEnum.STOPPED;
            })
    }


    async initFunc(){
        //implemented by child classes
        return true;
    }

    async stopService(){
        //implemented by child classes
        return true;
    }

    statusEnum = {
        NOTSTARTED: 0,
        RUNNING: 1,
        STOPPED: 2,
        FAILED: 3,
    }
}