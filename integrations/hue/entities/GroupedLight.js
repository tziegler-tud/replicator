import HueLight from "./HueLight.js";

export default class GroupedLight extends HueLight {
    constructor({bridgeApi, hueObject, uniqueId, lightId, identifier="MyHueGroupedLight", integration}={}){
        super({bridgeApi, hueObject, uniqueId, lightId, identifier, integration});
    }

    async setState(state){
        this.state = Object.assign(this.state, state);
        this.bridgeApi.setGroupedLightState(this.lightId, this.parseStateChangeToHue(state));
    }

    async getState(){
        let result = await this.bridgeApi.getGroupedLightState(this.lightId);
        this.state = this.parseHueToState(result);
        return this.state;
    }
}
