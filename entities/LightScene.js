/**
 * @class LightScene
 * @property {String} uniqueId
 * @property {String} identifier
 * @property {Object} nativeObject
 * @property {LightConfiguration} configuration
 * @property {LightGroup[]} groups
 * @property {Light[]} lights
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

    getJson(){
        return {
            id: this.id,
            uniqueId: this.uniqueId,
            identifier: this.identifier,
            nativeObject: this.nativeObject,
            lights: this.lights,
            scenes: this.scenes,
            groups: this.groups,
            settings: this.settings,
            properties: this.properties,
        }
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