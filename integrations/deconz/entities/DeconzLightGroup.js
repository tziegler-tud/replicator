import LightGroup from "../../../entities/LightGroup.js";

/**
 * @class DeconzLightGroup
 */
export default class DeconzLightGroup extends LightGroup {
    /**
     *
     * @param uniqueId
     * @param identifier
     * @param nativeObject
     * @param configuration
     */
    constructor({uniqueId, identifier= "NewDeconzLightGroup", nativeObject={}, configuration={}}={}){
        super({uniqueId: uniqueId, identifier: identifier, nativeObject: nativeObject, configuration: configuration});
        this.lights = [];
        this.scenes = [];
    }

    get(){
        // return {
        //     id: this.id,
        //     uniqueId: this.uniqueId,
        //     identifier: this.identifier,
        //     state: this.state,
        //     lights: this.lights,
        //     scenes: this.scenes,
        // }
        return this;
    }

    addLight(light){
        this.lights.add(light);
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
     * @param state
     * @returns {Promise<void>}
     */
    async setState(state){
        this.bridgeApi.setLightState(this.lightId, this.parseStateChangeToHue(state));
    }

    /**
     *
     * @returns {Promise<object>}
     */
    async getState(){
        this.nativeObject = await this.bridgeApi.getLightState(this.lightId);
        this.state = this.parseHueToState(this.nativeObject);
        return this.state;
    }


    getInternalState(){
        return this.state;
    }
    setInternalState(hueObject){
        this.state = this.parseHueChangeToState(hueObject);
    }


    async on(){
        return this.setState({on: true})
    };
    async off(){
        return this.setState({on: false})
    };
    async toggle(){
        let state = await this.getState();

        return this.setState({on: !state.on})
    };

    /**
     * relative brightness change. negative values to decrease
     * @param value
     */
    setBrightnessRelative(value=0){
        let absVal = value;
        let action = "up";
        if(value<0){
            //neg value.
            absVal = value * -1;
            action = "down";
        }
        return this.setState({
            dimming_delta: {
                action: action,
                brightness_delta: absVal,
            }
        })
    }

    setBrightnessAbsolute(value=0){
        const bri = this.normalizeBrightness(value)
        return this.setState({
            brightness: bri,
        })
    }
}