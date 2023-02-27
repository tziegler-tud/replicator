/**
 * @class LightGroup
 */
import Light from "./Light.js";

export default class LightGroup extends Light {
    constructor({uniqueId, identifier= "NewDefaultLightGroup", nativeObject={}, configuration={}}={}){
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
}