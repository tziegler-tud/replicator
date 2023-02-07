/**
 * @class LightGroup
 */
export default class LightGroup {
    constructor(uniqueId, identifier="NewLight", nativeObject={}){
        this.id = undefined;
        this.uniqueId = uniqueId;
        this.identifier = identifier;
        this.state = {
            on: false,
            brightness: 0,
            hue: 0,
            sat: 0,
            reachable: false,
        };
        this.nativeObject = nativeObject;
        this.lights = [];
        this.scenes = [];
    }

    parseState(state){
        //parse an object to the target state
        return {
            on: state.on,
            brightness: state.brightness,
            hue: state.hue,
            sat: state.sat,
            reachable: state.reachable,
        }
    }

    get(){
        return {
            id: this.id,
            uniqueId: this.uniqueId,
            identifier: this.identifier,
            state: this.state,
            lights: this.lights,
            scenes: this.scenes,
        }
    }

    addLight(light){
        this.lights.add(light);
    }

    getState(){
        return this.state;
    }

    setState(state){
        Object.assign(this.state, state);
    }

    off(){
        this.state.on = false;
    }

    on(){
        this.state.on = true;
    }

    toggle(){
        this.state.on = !this.state.on;
    }

    setBrightness(){

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