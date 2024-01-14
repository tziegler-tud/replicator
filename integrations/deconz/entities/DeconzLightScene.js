import LightScene from "../../../entities/LightScene.js";

export default class DeconzLightScene extends LightScene {
    constructor({bridgeApi, nativeObject, uniqueId, sceneId, deconzGroup, identifier="MyHueScene", integration}){
        super(uniqueId, identifier);
        this.sceneId = sceneId;
        this.bridgeApi = bridgeApi;
        this.integration = integration;
        this.nativeObject = nativeObject;
        this.groupUniqueId = deconzGroup.uniqueId;
        this.deconzGroupId = deconzGroup.nativeObject.id;
        this.group = deconzGroup;
    }

    activate(){
        if(this.groupId === undefined || this.sceneId === undefined) {
            console.error("Failed to activate scene: GroupId or SceneId not set. GroupId: " + this.groupId + " , SceneId: "+ this.sceneId);
            return new Promise((resolve, reject) => {
                reject();
            })
        }
        this.bridgeApi.activateScene(this.deconzGroupId, this.uniqueId);
    }
}