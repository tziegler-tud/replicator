import LightScene from "../../../entities/LightScene.js";

export default class HueLightScene extends LightScene {
    constructor({bridgeApi, hueObject, uniqueId, sceneId, identifier="MyHueScene", integration}){
        super(uniqueId, identifier);
        this.sceneId = sceneId;
        this.bridgeApi = bridgeApi;
        this.integration = integration;
        this.nativeObject = hueObject;
    }

    activate(){
        this.bridgeApi.activateScene(this.uniqueId);
    }
}