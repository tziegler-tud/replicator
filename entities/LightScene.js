/**
 * @class LightScene
 */
export default class LightScene {
    constructor(uniqueId, identifier="NewLightScene", nativeObject={}){
        this.id = undefined;
        this.uniqueId = uniqueId;
        this.identifier = identifier;
        this.nativeObject = nativeObject;
        this.lights = [];
        this.scenes = [];
        this.settings = undefined;
    }

    get(){
        return {
            id: this.id,
            uniqueId: this.uniqueId,
            identifier: this.identifier,
        }
    }

    activate(){
        return true;
    }


    loadSettings(dbSettings){
        this.settings = dbSettings;
        this.id = dbSettings.id;
        this.identifier = dbSettings.identifier;
    }

    saveToDb(){
        return this.settings.save();
    }
}