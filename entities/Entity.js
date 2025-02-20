
/**
 * @class Entity
 */
export default class Entity {
    constructor({uniqueId, identifier= "NewDefaultSensor", nativeObject={}, configuration={}}={}){
        this.id = undefined;
        this.uniqueId = uniqueId;
        this.identifier = identifier;
        this.state = {};
        this.configuration = configuration;
        this.nativeObject = nativeObject;
        this.settings = {
            identifier: identifier,
        };
        this.properties = {};
    }

    get() {
        return this;
    }

    getJson(){
        return {
            id: this.id,
            uniqueId: this.uniqueId,
            identifier: this.identifier,
            state: this.state,
            configuration: this.configuration ,
            nativeObject: this.nativeObject,
            settings: this.settings,
            properties: this.properties,
        }
    }

    async getState(){
        return this.state;
    }

    /**
     *
     * @param state {EntityState}
     * @returns {Promise<void>}
     */
    async setState(state){
        Object.assign(this.state, state);
    }

    getInternalState(){
        return this.state;
    }
    setInternalState(state){
        Object.assign(this.state, state);
    }

    loadSettings(dbSettings){
        this.settings = dbSettings;
        this.id = dbSettings.id;
        this.identifier = dbSettings.identifier;
    }

    saveToDb(){
        let self = this;
        return new Promise(function(resolve, reject){
            self.settings.save()
                .then(settings => {
                    self.settings=settings;
                    resolve(self);
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    /**
     *
     * @returns {Entity}
     */
    clone() {
        let l = new Entity({
            uniqueId: this.uniqueId,
            identifier: this.identifier,
            nativeObject: this.nativeObject,
            configuration: this.configuration,
        });
        l.id = this.id;
        l.state = this.state;
        l.configuration = this.configuration;
        l.properties = this.properties;
    }
}