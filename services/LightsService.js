import https from 'https';
import http from 'http';
import Service from "./Service.js";
import db from '../schemes/mongo.js';
import Light from "../entities/Light.js";
const DbLight = db.Light;
const DbLightGroup = db.LightGroup;
const DbLightScene = db.LightScene;

class LightsService extends Service {
    constructor(){
        super();
        this.serviceName = "LightsService";
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
     * @param group {LightGroup}
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
                    scene.setGroups([group]);
                    scene.assignProperty("groupID", group.uniqueId)
                    scene.assignProperty("groupName", group.identifier);
                }
                else {
                    changed = true;
                    scene.setGroups([group]);
                    scene.assignProperty("groupID", group.uniqueId)
                    scene.assignProperty("groupName", group.identifier);
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

    /**
     *
     * @returns {Promise<Light[]>}
     */
    getLightsAsync(json = false){
        let self = this;
        return new Promise(function(resolve, reject){
            let p = [];
            self.lights.forEach(light => {
                p.push(json ? light.getJson() : light.get());
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

    getLights(json = false){
        let p = [];
        this.lights.forEach(light => {
            p.push(json ? light.getJson() : light.get());
        })
        return p;
    }

    getGroups(json = false){
        let self = this;
        return new Promise(function(resolve, reject){
            let p = [];
            self.groups.forEach(group => {
                p.push(json ? group.getJson() : group.get());
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

    getScenes(json = false){
        let self = this;
        return new Promise(function(resolve, reject){
            let p = [];
            self.scenes.forEach(scene => {
                p.push(json ? scene.getJson() : scene.get());
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

    /**
     *
     * @param id
     * @returns {Promise<Light|undefined>}
     */
    async getLightById(id){
        return this.findLightById(id).get();

    }

    /**
     *
     * @param uniqueId
     * @returns {Promise<Light|undefined>}
     */
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

    /**
     *
     * @param id
     * @returns {Light | undefined}
     */
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
     * @param newState {LightStateUpdate}
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
     * @param newState {LightState}
     */
    setLightState(lightId, newState) {
        let self = this;
        let state = parseState(newState);
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
     * @param lightId {string}
     * @param newState {boolean} true to turn on, false to turn off
     * @returns {Promise<unknown>}
     */
    setLightOnOffState(lightId, newState) {
        let self = this;
        let state = parseState(newState);
        return new Promise(function (resolve, reject) {
            self.init.then(function () {
                //get light
                let light = self.findLightById(lightId);
                light.onOff(newState)
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
     * @param id {string} group database id
     * @param newState {LightGroupState}
     */
    setGroupState(id, newState) {
        let self = this;
        let state = parseState(newState);
        return new Promise(function (resolve, reject) {
            self.init.then(function () {
                //get light
                let group = self.findGroupById(id);
                group.setState(newState)
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
                    return self.setLightState(id, newState)
                }
            })
            .catch(e => {
                return false;
            })
    }

    async saveLightsState(){
        let p = [];
        const lightsArray = this.getLights();
        for (const light of lightsArray) {
            p.push(light.clone());
        }
        return p;

    }

    /**
     *
     * @param {Light[]} lights
     */
    async restoreLightsState(lights){
        for(const lightConfig of lights){
            //find light
            const light = this.findLightById(lightConfig.id);
            await light.restoreState(lightConfig);
        }
        return true;
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
 * @param [max] {Number} maximum brightness used for normalizing. Default: 254
 * @param [min] {Number} minimum brightness used for normalizing. Default: 0
 * @returns {number} A number in range 0 - max, where 0 equals 0% and max equals 100%;
 */
function parseBrightness(percent, max=254, min=0){
    //percent might be a string with the % symbol at the end. remove it
    if(typeof percent === "string") {
        percent.replace("%", "");
        percent = parseInt(percent);
    }
    //254 equals 100%; 0 equals 0%
    if(percent > 100) percent = 100;
    if(percent < -100) percent = -100;
    if(percent === 0) return min;
    return Math.round(min + (percent/100) * (max-min));
}

/**
 * Returns a Value as integer between 0 - 254.
 * @param brightness {Number|String}
 * @param [max] {Number} maximum brightness used for normalizing. Default: 254
 * @param [min] {Number} minimum brightness used for normalizing. Default: 0
 * @returns {Integer}
 */
function normalizeBrightness(brightness, max=254, min=0) {
    brightness = parseInt(brightness);
    if (brightness > max) return max;
    if (brightness < min) return min;
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