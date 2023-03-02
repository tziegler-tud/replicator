import LightScene from "../../../entities/LightScene.js";

export default class HueLightScene extends LightScene {
    constructor({bridgeApi, hueObject, uniqueId, sceneId, identifier="MyHueScene", integration}){
        super(uniqueId, identifier)
    }

    activate(){
        this.bridgeApi.activateScene(this.uniqueId);
    }
}