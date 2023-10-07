import HueLight from "./HueLight.js";

export default class GroupedLight extends HueLight {
    constructor({bridgeApi, hueObject, uniqueId, lightId, identifier="MyHueGroupedLight", integration}={}){
        super({bridgeApi, hueObject, uniqueId, lightId, identifier, integration});
    }

    /**
     *
     * @param state
     * @param disableParsing {Boolean} if set to true, the provided object is directly send to the bridge. Internal state is left unchanged.
     * @returns {Promise<void>}
     */
    async setState(state, disableParsing=false){
        if(disableParsing){
            this.bridgeApi.setGroupedLightState(this.lightId, state);
        }
        else {
            this.state = Object.assign(this.state, state);
            this.bridgeApi.setGroupedLightState(this.lightId, this.parseStateChangeToHue(state));
        }
    }

    async getState(){
        let result = await this.bridgeApi.getGroupedLightState(this.lightId);
        this.state = this.parseHueToState(result);
        return this.state;
    }
}
