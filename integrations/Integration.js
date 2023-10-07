/**
 * @class
 * @abstract
 * Abstract Integration class.
 * Implementations of this class should expose a singleton instance to the app, useable by imports.
 * Module export of such a class should be a new instance.
 */
export default class Integration {
    constructor(){
        let self = this;
        this.initStarted = false;
        this.uniqueName = "abstract";
        this.readableName = "AbstractIntegration";
        this.status = this.statusEnum.NOTLOADED;
        this.integration = {
            type: "Abstract",
            data: {},
        }

        this.lights = [];
        this.grouped_lights = [];
        this.scenes = [];
    }

    /**
     * start the service
     * @param args {Object} Arguments object forwarded to the initialization function.
     */
    load(args){
        let self = this;
        this.initStarted = true;
        return new Promise(function(resolve, reject){
            self.initFunc(args)
                .then(result => {
                    self.status = self.statusEnum.LOADED;
                    resolve();
                })
                .catch(err => {
                    self.status = self.statusEnum.NOTLOADED;
                    reject("Integration failed to load.");
                });
        });
    }

    async initFunc(){
        //implemented by child classes
        return true;
    }

    async reload(args={}){
        console.log("Reloading integration: " + this.uniqueName);
        this.status = this.statusEnum.NOTLOADED;
        return this.load(args);
    }

    getIntegration(data) {
        const i = {
            data: data,
        }
        return Object.assign(this.integration, i);
    }


    statusEnum = {
        NOTLOADED: 0,
        LOADED: 1
    }
}