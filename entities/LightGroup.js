

/**
 * @typedef LightGroupState
 * @property {boolean} on
 * @property {number} brightness
 * @property {number} hue
 * @property {number} sat
 * @property {number} color_temperature
 * @property {string} action
 * @property {LightColorObject} color
 */

/**
 * @typedef LightGroupStateUpdate
 * @property {boolean} [on]
 * @property {number} [brightness]
 * @property {number} [hue]
 * @property {number} [sat]
 * @property {number} [color_temperature]
 * @property {string} [action]
 * @property {LightColorObject} [color]
 */

import Light from "./Light.js";
import LightScene from "./LightScene.js";

/**
 * @class LightGroup
 * @property {string} uniqueId
 * @property {string} id internal database id
 * @property {Light[]} lights
 * @property {LightScene[]} scenes
 * @property {LightGroupState} state
 * @property {string} groupId
 */
export default class LightGroup extends Light {

    /**
     *
     * @param {String} uniqueId
     * @param {String} identifier
     * @param {String} groupId
     * @param {Object} nativeObject
     * @param {LightConfiguration} configuration
     */
    constructor({uniqueId, identifier= "NewDefaultLightGroup", groupId, nativeObject={}, configuration={}}={}){
        super({uniqueId: uniqueId, identifier: identifier, lightId: groupId, nativeObject: nativeObject, configuration: configuration});
        this.lights = [];
        this.scenes = [];
        this.integration = "default";
        this.groupId = groupId;
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

    /**
     *
     * @param light {Light}
     */
    addLight(light){
        this.lights.add(light);
    }

    /**
     *
     * @param scene {LightScene}
     */
    addScene(scene) {
        this.scenes.add(scene);
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