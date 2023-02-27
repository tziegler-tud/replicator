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
        this.status = this.statusEnum.NOTLOADED;
        this.integration = {
            type: "Abstract",
            data: {},
        }
        this.init = new Promise(function (resolve, reject) {
            self.resolveInit = resolve;
            self.rejectInit = reject;
        })
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
                    self.resolveInit();
                    resolve();
                })
                .catch(err => {
                    self.status = self.statusEnum.NOTLOADED;
                    self.rejectInit();
                    reject();
                });
        });
    }

    async initFunc(){
        //implemented by child classes
        return true;
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