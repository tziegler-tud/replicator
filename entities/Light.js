/**
 * @class Light
 */
export default class Light {
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

    get() {
        return {
            id: this.id,
            uniqueId: this.uniqueId,
            identifier: this.identifier,
            state: this.state,
        }
    }

    getState(){
        return this.state;
    }

    setState(state){
        Object.assign(this.state, state);
    }

    /**
     * turns the light on or off
     * @param state {Boolean}
     */
    onOff(state){
        return this.setState({on: state})
    }

    on(){
        return this.setState({on: true})
    };
    off(){
        return this.setState({on: true})
    };
    toggle(){
        return this.setState({on: true})
    };

    setBrightness(){

    }

    loadSettings(dbSettings){
        this.settings = dbSettings;
        this.id = dbSettings.id;
        this.identifier = dbSettings.identifier;
    }
}