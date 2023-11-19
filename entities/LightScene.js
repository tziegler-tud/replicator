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
        this.groups = [];
        this.settings = undefined;
        this.properties = {};
    }

    get(){
        return this;
    }

    getGroups(){
        return this.groups;
    }

    setGroups(groups){
        this.groups = groups;
    }

    activate(){
        return true;
    }

    getState(){

    }

    setState(){

    }

    getInternalState(){

    }

    setInternalState(){

    }




    loadSettings(dbSettings){
        this.settings = dbSettings;
        this.id = dbSettings.id;
        this.identifier = dbSettings.identifier;
    }

    saveToDb(){
        return this.settings.save();
    }

    assignProperty(propertyName, value){
        this.properties[propertyName] = value;
    }
}