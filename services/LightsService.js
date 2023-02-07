import https from 'https';
import http from 'http';
import Service from "./Service.js";
import db from '../schemes/mongo.js';
const DbLight = db.Light;
const DbLightGroup = db.LightGroup;
const DbLightScene = db.LightScene;

class LightsService extends Service {
    constructor(){
        super();
        this.groups = [];
        this.lights = [];
        this.scenes = [];
    }

    initFunc(){
        let self = this;
        console.log("Initializing LightsService...");
        return new Promise(function(resolve, reject){
            resolve();
        })
    }

    /**
     *
     * @param light {Light}
     * @returns {Promise<unknown>}
     */
    addLight(light) {
        let self = this;
        return new Promise(function(resolve, reject){
            //check if a matching light is present in db
            DbLight.findOne({uniqueId: light.uniqueId})
                .then(settings => {
                    if(settings) {
                        light.loadSettings(settings);
                        self.lights.push(light);
                        resolve(light);
                    }
                    else {
                        //create a new light and save to db
                        const lightSettings = {
                            uniqueId: light.uniqueId,
                            identifier: light.identifier,
                        }
                        let dbLight = new DbLight(lightSettings);
                        dbLight.save()
                            .then(result => {
                                light.loadSettings(result)
                                self.lights.push(light);
                                resolve(light)
                            })
                    }
                })
        })
    }

    /**
     *
     * @param group
     * @returns {Promise<unknown>}
     */
    addGroup(group){
        let self = this;
        return new Promise(function(resolve, reject){
            //check if a matching group is present in db
            DbLightGroup.findOne({uniqueId: group.uniqueId})
                .then(settings => {
                    if(settings) {
                        group.loadSettings(settings);
                        self.groups.push(group);
                        resolve(group);
                    }
                    else {
                        //create a new group and save to db
                        const groupSettings = {
                            uniqueId: group.uniqueId,
                            identifier: group.identifier,
                            lights: [],
                        }
                        let dbLightGroup = new DbLightGroup(groupSettings);
                        dbLightGroup.save()
                            .then(result => {
                                group.loadSettings(result)
                                self.groups.push(group);
                                resolve(group)
                            })
                    }
                })
        })
    }

    /**
     *
     * @param scene {LightScene}
     * @returns {Promise<unknown>}
     */
    addScene(scene){
        let self = this;
        return new Promise(function(resolve, reject){
            //check if a matching group is present in db
            DbLightScene.findOne({uniqueId: scene.uniqueId})
                .then(settings => {
                    if(settings) {
                        scene.loadSettings(settings);
                        self.scenes.push(scene);
                        resolve(scene);
                    }
                    else {
                        //create a new group and save to db
                        const sceneSettings = {
                            uniqueId: scene.uniqueId,
                            identifier: scene.identifier,
                        }
                        let dbLightScene = new DbLightScene(sceneSettings);
                        dbLightScene.save()
                            .then(result => {
                                scene.loadSettings(result)
                                self.scenes.push(scene);
                                resolve(scene)
                            })
                    }
                })
        })
    }

    addLightsToGroup({groupUniqueId, lightUniqueIdArray}) {
        let self = this;
        return new Promise(function(resolve, reject){
            const group = self.findGroupByUniqueId(groupUniqueId);
            const lights = [];

            let changed = false;

            if(!group) {
                //group not found.
                reject("Group not found.");
            }

            lightUniqueIdArray.forEach(lightUniqueId => {
                let light = self.findLightByUniqueId(lightUniqueId);
                if (!light) reject("Light not found");
                // check if light is already in group
                const inGroup = group.lights.find(l => {
                    return l.toString() === light.id.toString();
                });
                if (inGroup){
                }
                else {
                    changed = true;
                    group.lights.push(light.id);
                }
            });
            if(changed){
                group.saveToDb()
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err)
                    })
            }
            else resolve();
        })
    }

    addLightToGroup({groupUniqueId, lightUniqueId}) {
        let self = this;
        return new Promise(function(resolve, reject){
            const group = self.findGroupByUniqueId(groupUniqueId);
            const light = self.findLightByUniqueId(lightUniqueId);
            if(!group) {
                //group not found.
                reject("Group not found.");
            }
            if (!light) reject("Light not found");

            // check if light is already in group
            const inGroup = group.lights.find(l => {
                return l._id.toString() === light._id.toString();
            });
            if (inGroup){
                resolve(group);
            }
            else {
                group.lights.push(light);
                group.save()
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err)
                    })
            }
        })
    }

    removeLightFromGroup(groupId, lightId) {
        let self = this;
        return new Promise(function(resolve, reject){
            const group = self.findGroupById(groupId);
            const light = self.findLightById(lightId);
            if(!group) {
                //group not found.
                reject("Group not found.");
            }
            if (!light) reject("Light not found");

            // check if light is already in group
            const inGroup = group.lights.indexOf(l => {
                return l.id.toString() === light.id.toString();
            });
            if (inGroup > -1){
                group.lights.splice(inGroup, 1);
                group.save()
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
            else {
                reject("Light is not in group")
            }
        })
    }

    addScenesToGroup({groupUniqueId, sceneUniqueIdArray}) {
        let self = this;
        return new Promise(function(resolve, reject){
            const group = self.findGroupByUniqueId(groupUniqueId);
            const lights = [];

            let changed = false;

            if(!group) {
                //group not found.
                reject("Group not found.");
            }

            sceneUniqueIdArray.forEach(sceneUniqueId => {
                let scene = self.findSceneByUniqueId(sceneUniqueId);
                if (!scene) reject("Scene not found");
                // check if scene is already in group
                const inGroup = group.scenes.find(s => {
                    return s.toString() === scene.id.toString();
                });
                if (inGroup){
                }
                else {
                    changed = true;
                    group.scenes.push(scene.id);
                }
            });
            if(changed){
                group.saveToDb()
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err)
                    })
            }
            else resolve();
        })
    }

    getLights(){
        let self = this;
        return new Promise(function(resolve, reject){
            let p = [];
            self.lights.forEach(light => {
                p.push(light.get());
            })
            Promise.all(p)
                .then(result => {
                    resolve(result);
                })
                .catch(err => {
                    reject(err)
                })
        })

    }

    getGroups(){
        let self = this;
        return new Promise(function(resolve, reject){
            let p = [];
            self.groups.forEach(light => {
                p.push(light.get());
            })
            Promise.all(p)
                .then(result => {
                    resolve(result);
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    getScenes(){
        let self = this;
        return new Promise(function(resolve, reject){
            let p = [];
            self.scenes.forEach(light => {
                p.push(light.get());
            })
            Promise.all(p)
                .then(result => {
                    resolve(result);
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    async getGroupById(id=""){
        const group = this.groups.find(group => group.id.toString() === id.toString());
        return group.get();
    }

    async getGroupByUniqueId(uniqueId){
        const group = this.groups.find(group => group.uniqueId === uniqueId);
        return group.get();
    }

    async getLightById(id){
        return this.findLightById(id).get();

    }
    async getLightByUniqueId(uniqueId){
        return this.findLightByUniqueId(uniqueId).get();
    }

    async getSceneById(id=""){
        const scene = this.scenes.find(scene => scene.id.toString() === id.toString());
        return scene.get();
    }

    async getSceneByUniqueId(uniqueId){
        const scene = this.scenes.find(scene => scene.uniqueId === uniqueId);
        return scene.get();
    }

    findGroupById(id=""){
        return this.groups.find(group => group.id.toString() === id.toString());
    }

    findGroupByUniqueId(uniqueId){
        return this.groups.find(group => group.uniqueId === uniqueId);
    }

    findLightById(id){
        return this.lights.find(light => light.id.toString() === id.toString());
    }
    findLightByUniqueId(uniqueId){
        return this.lights.find(light => light.uniqueId === uniqueId);
    }

    findSceneById(id){
        return this.scenes.find(scene => scene.id.toString() === id.toString());
    }
    findSceneByUniqueId(uniqueId){
        return this.scenes.find(scene => scene.uniqueId === uniqueId);
    }

    /**
     *
     * @param groupName {string}
     * @returns {Promise<Integer>}
     */
    getLightGroupIdByName(groupName) {
        let self = this;
        return new Promise(function(resolve, reject){
            self.init.then(function(){
                Object.keys(self.groups).forEach(function(key){
                    if(self.groups[key].name === groupName) {
                        resolve(key);
                    }
                })
                reject()
            })
        })
    }

    /**
     *
     * @param lightName {string}
     * @returns {Promise<Integer>}
     */
    getLightIdByName(lightName) {
        let self = this;
        return new Promise(function(resolve, reject){
            self.init.then(function(){
                Object.keys(self.lights).forEach(function(key){
                    if(self.lights[key].name === lightName) {
                        resolve(key);
                    }
                })
                reject()
            })
        })
    }

    /**
     *
     * @param lightId {number}
     * @param newState {Object}
     */
    setLightProperty(lightId, newState) {
        let self = this;
        return new Promise(function (resolve, reject) {
            self.init.then(function () {
                //get light
                let light = self.findLightById(lightId);
                light.setState(newState)
                    .then(result => {
                        resolve(result)
                    })
                    .catch(err => {
                        reject(err)
                    })
            })
        });
    }


    /**
     *
     * @param lightId {number}
     * @param newState {Boolean}
     */
    setLightState(lightId, newState) {
        let self = this;
        let state = parseState(newState);
        return new Promise(function (resolve, reject) {
            self.init.then(function () {
                //get light
                let light = self.findLightById(lightId);
                light.onOff(state)
                    .then(result => {
                        resolve(result)
                    })
                    .catch(err => {
                        reject(err)
                    })
            })
        });
    }

    /**
     *
     * @param lightName {string}
     * @param newState {Boolean}
     */
    setLightStateByName(lightName, newState) {
        let self = this;
        this.getLightIdByName(lightName)
            .then(id => {
                if(id){
                    self.setLightState(id, newState)
                }
            })
            .catch(e => {
                return false;
            })
    }

    /**
     *
     * @param lightId {number}
     */
    toggleLightState(lightId) {
        let self = this;
        this.BridgeApi.getLightState(lightId)
            .then(group => {
                let newState = !group.state["any_on"];
                return self.setLightState(lightId, newState);
            })
            .catch(e => {
                return false;
            })
    }
    /**
     *
     * @param lightName
     * @param newState
     */
    toggleLightStateByName(lightName) {
        let self = this;
        this.getLightIdByName(lightName)
            .then(id => {
                if(id){
                    return self.toggleLightState(id);
                }
            })
            .catch(e => {
                return false;
            })
    }



    /**
     * sets a groups state
     * @param groupId {Integer}
     * @param newState {Boolean} true = on, false = off
     */
    setLightGroupState(groupId, newState) {
        let state = parseState(newState);
        //find group
        console.log("setting lights to " + state + " for group " + groupId);
        this.BridgeApi.setGroupState(groupId, {on: state})
            .then(result => {

            })
            .catch(e => {
                return false;
            })
    }

    /**
     *
     * sets a groups state by group name
     *
     * @param groupName {string} group name as assigned by hue bridge
     * @param newState {Boolean} The absolute or relative percent value to set as new brightness. Must be in interval [-100, 100].
     */
    setLightGroupStateByName(groupName, newState) {
        //find group
        this.getLightGroupIdByName(groupName)
            .then(id => {
                if(id){
                    this.setLightGroupState(id, newState)
                }
            })
            .catch(e => {
                return false;
            })
    }

    /**
     * sets the brightness of a light
     * @param lightId {Integer} light id as given by hue bridge
     * @param percentValue {Integer} The absolute or relative percent value to set as new brightness. Must be in interval [-100, 100].
     * @param isRelative {Boolean=false} If true, the percent value is added to the current value. Else, it is set as an absolute value. Default: false
     */
    setLightBrightness(lightId, percentValue, isRelative) {
        if (isRelative === undefined) isRelative = false;
        let bri = parseBrightness(percentValue);
        if(isRelative){
            this.BridgeApi.getLightState(lightId)
                .then(light => {
                    let totalBri = normalizeBrightness(bri + light.state.bri);
                    this.BridgeApi.setLightState(lightId, {on: true, bri: totalBri})
                        .then(result => {

                        })
                        .catch(e => {
                            return false;
                        })
                })
        }
        else {
            this.BridgeApi.setLightState(lightId, {on: true, bri: bri})
                .then(result => {

                })
                .catch(e => {
                    return false;
                })
        }
    }

    /**
     *
     * sets a lights brightness by group name
     *
     * @param lightName {string} light name as assigned by hue bridge
     * @param percentValue {Integer} The absolute or relative percent value to set as new brightness. Must be in interval [-100, 100].
     * @param isRelative {Boolean=false} If true, the percent value is added to the current value. Else, it is set as an absolute value. Default: false
     */
    setLightBrightnessByName(lightName, percentValue, isRelative) {
        if (isRelative === undefined) isRelative = false;
        this.getLightIdByName(lightName)
            .then(lightId => {
                if(lightId){
                    this.setLightBrightness(lightId, percentValue, isRelative)
                }
            })
            .catch(e => {
                return false;
            })
    }

    /**
     *
     * sets a groups brightness
     *
     * @param groupId {Integer} group Id as assigned by hue bridge
     * @param percentValue {Integer} The absolute or relative percent value to set as new brightness. Must be in interval [-100, 100].
     * @param isRelative {Boolean=false} If true, the percent value is added to the current value. Else, it is set as an absolute value. Default: false
     */
    setLightGroupBrightness(groupId, percentValue, isRelative) {
        if (isRelative === undefined) isRelative = false;
        let bri = parseBrightness(percentValue);
        //find group
        if(isRelative){
            this.BridgeApi.getGroupState(groupId)
                .then(group => {
                    let totalBri = normalizeBrightness(bri + group.action.bri)
                    console.log("setting brightness to " + bri + " for group " + group.name);
                    this.BridgeApi.setGroupState(groupId, {on: true, bri: totalBri})
                        .then(result => {

                        })
                        .catch(e => {
                            return false;
                        })
                })
        }
        else {
            console.log("setting brightness to " + bri + " for group with id " + groupId);
            this.BridgeApi.setGroupState(groupId, {on: true, bri: normalizeBrightness(bri)})
                .then(result => {

                })
                .catch(e => {
                    return false;
                })
        }
    }

    /**
     *
     * sets a groups brightness by group name
     *
     * @param groupName {string} group name as assigned by hue bridge
     * @param percentValue {Integer} The absolute or relative percent value to set as new brightness. Must be in interval [-100, 100].
     * @param isRelative {Boolean=false} If true, the percent value is added to the current value. Else, it is set as an absolute value. Default: false
     */
    setLightGroupBrightnessByName(groupName, percentValue, isRelative) {
        if (isRelative === undefined) isRelative = false;
        //find group
        let g = this.getLightGroupIdByName(groupName)
            .then(id => {
                if(id){
                    this.setLightGroupBrightness(id, percentValue, isRelative)
                }
            })
            .catch(e => {
                return false;
            })
    }

    /**
     * toggles a light group on or off
     * @param groupId {number}
     */
    toggleLightGroup(groupId) {
        let self = this;
        //turn off all lights if any is on, turn on all lights otherwise
        //get group state
        this.BridgeApi.getGroupState(groupId)
            .then(group => {
                let newState = !group.state["any_on"];
                return self.setLightGroupState(groupId, newState);
            })
            .catch(e => {
                return false;
            })

    }
    /**
     * toggles a light group on or off
     * @param groupName {string}
     */
    toggleLightGroupByName(groupName) {
        let self = this;
        //find group
        this.getLightGroupIdByName(groupName)
            .then(id => {
                if(id){
                    //turn off all lights if any is on, turn on all lights otherwise
                    return self.toggleLightGroup(id);
                }
            })
            .catch(e => {
                return false;
            })
    }

    /**
     * sets a groups state
     * @param groupId {Integer}
     * @param sceneName {string} name of the scene to select. Must match a scene name that is known to the hue bridge
     */
    setLightGroupScene(groupId, sceneName) {
        let self = this;
        return new Promise(function(resolve, reject){
            self.BridgeApi.getScenes()
                .then(scenes => {
                    //flatten object into array
                    let scenesArray = [];
                    Object.keys(scenes).forEach(key => {
                        let oj = scenes[key];
                        oj.id = key;
                        scenesArray.push(oj);
                    })
                    //check if scene exists
                    let scene = scenesArray.find(s => (s.name === sceneName && s.type === "GroupScene" && s.group === groupId));
                    if(scene !== undefined) {
                        self.BridgeApi.setGroupScene(groupId, {scene: scene.id})
                            .then(result => {
                                resolve();
                            })
                            .catch(e => {
                                reject(e)
                            })
                    }
                    else {
                        reject("Scene not found: "+ sceneName);
                    }

                })
                .catch(err => {
                    console.error(err);
                    reject()
                })
        })

    }

    /**
     *
     * sets a groups state by group name
     *
     * @param groupName {string} group name as assigned by hue bridge
     * @param sceneName {string} name of the scene to select, as it is known by the hue bridge
     */
    setLightGroupSceneByName(groupName, sceneName) {
        //find group
        this.getLightGroupIdByName(groupName)
            .then(id => {
                if(id){
                    this.setLightGroupScene(id, sceneName);
                }
            })
            .catch(e => {
                return false;
            })
    }

}

LightsService.STATES = {
    OFF: false,
    ON: true,
}

class location {
    constructor(identifier){
        this.lights = [];
    }
    addLight(lightIdentifier){

    }
    getLights(){
        return this.lights;
    }
    getLightState(){

    }
}

/**
 *
 * @param percent {String|Number} percent value, potentially a string with % at the end
 * @returns {number} A number in range 0 - 254, where 0 equals 0% and 254 equals 100%;
 */
function parseBrightness(percent){
    //percent might be a string with the % symbol at the end. remove it
    if(typeof percent === "string") {
        percent.replace("%", "");
        percent = parseInt(percent);
    }
    //254 equals 100%; 0 equals 0%
    if(percent > 100) percent = 100;
    if(percent < -100) percent = -100;
    return Math.round(percent * 2.54)
}

/**
 * Returns a Value as integer between 0 - 254.
 * @param brightness {Number|String}
 * @returns {Integer}
 */
function normalizeBrightness(brightness) {
    brightness = parseInt(brightness);
    if (brightness > 254) return 254;
    if (brightness < 0) return 0;
    return brightness
}

function parseState(state){
    if(state === undefined) return false;
    switch(typeof state){
        case "string":
            if(state.toUpperCase() === "off".toUpperCase()) return LightsService.STATES.OFF;
            if(state.toUpperCase() === "on".toUpperCase()) return LightsService.STATES.ON;
            else return false;
        case "object":
            if(state.toString().toUpperCase() === "off".toUpperCase()) return LightsService.STATES.OFF;
            if(state.toString().toUpperCase() === "on".toUpperCase()) return LightsService.STATES.ON;
            else return false;
        case "boolean":
            return state;
        default:
            return false;
    }
}

export default new LightsService();