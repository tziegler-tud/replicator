import Integration, {httpGet, httpsGet} from "../Integration.js";
import LightsService from "../../services/LightsService.js";
import DeconzBridgeApi from "./DeconzBridgeApi.js"
import DeconzLight from "./entities/DeconzLight.js";
import DeconzLightGroup from "./entities/DeconzLightGroup.js";
import DeconzLightScene from "./entities/DeconzLightScene.js";
import EventStreamHandler from "./EventStreamHandler.js";
import DeconzSensor from "./entities/DeconzSensor.js";
import SensorService from "../../services/SensorService.js";

/** @typedef {import('../../entities/LightGroup.js').LightGroup} LightGroup */


export default class DeconzIntegration extends Integration {
    constructor({host, port=80, apiKey} = {}) {
        super();
        this.readableName = "Deconz Api Integration"
        this.integration = {
            type: "Deconz",
            data: {}
        }
        this.port = port
        this.locations = [];


        this.lightObjects = [];
        this.groupObjects = [];
        this.sceneObjects = [];
        this.sensorObjects = [];

        this.host = host;
        this.apiKey = apiKey;

        this.BridgeUrl = undefined;
        this.BridgeUser = undefined;
        this.initStarted = false;

    }

    async initFunc() {
        let self = this;
        this.BridgeUrl = this.host + ":" + this.port;
        this.BridgeUser = this.apiKey;
        const errMsg = "Failed to load " + this.readableName + ": ";
        this.log("Loading " + this.readableName + "...");

        //try to reach the bridge
        return new Promise((resolve, reject) => {
            this.checkBridge(self.BridgeUrl)
                .then(checkResult => {
                    self.BridgeUrl = checkResult.url;
                    self.Bridge = checkResult.bridge;
                    //check user auth
                    this.authBridge()
                        .then(fullConfiguration => {
                            self.BridgeApi = new DeconzBridgeApi({host: this.host, port: this.port, apiKey: this.apiKey});

                            let configPromise = self.BridgeApi.getConfiguration();

                            let lightsPromise = self.BridgeApi.getLights();
                            let groupsPromise = self.BridgeApi.getGroups();
                            let sensorsPromise = self.BridgeApi.getSensors();

                            Promise.all([lightsPromise, groupsPromise, sensorsPromise, configPromise])
                                .then(result => {
                                    const lights = result[0];
                                    const groups = result[1];
                                    const sensors = result[2];
                                    self.BridgeConfiguration = result[3];

                                    self.lightObjects = lights;
                                    self.groupObjects = groups;
                                    self.sensorObject = sensors;

                                    //add lights to runtime
                                    let lightsPromise = self.addLights(lights)
                                    let groupsPromise = self.addGroups(groups);
                                    let sensorsPromise = self.addSensors(sensors);


                                    Promise.all([lightsPromise, groupsPromise, sensorsPromise])
                                        .then(result => {
                                            const groups = result[1]
                                            self.addLightsToGroups(groups)
                                                .then(() => {
                                                    self.addScenesFromGroups(groups)
                                                        .then(result => {
                                                            // //subscribe to eventstream
                                                            const eventStreamHandler = new EventStreamHandler(self, this.host, this.BridgeConfiguration.websocketport)
                                                            resolve(self);
                                                        })
                                                        .catch(err => {
                                                            reject(errMsg + err);

                                                        })
                                                })
                                                .catch(err => {
                                                    reject(errMsg + err)
                                                })
                                        })
                                        .catch(err => {
                                            reject(errMsg + err)
                                        })
                                })
                                .catch(err => {
                                    reject(errMsg + err)
                                })
                        })
                });
        });

    }


    checkBridge(url) {
        return new Promise((resolve, reject) => {
            this.verifyBridge(url)
                .then(bridge => {
                    this.log("Deconz Bridge discovered successfully.");
                    resolve({url: url, bridge: bridge});
                })
                .catch(err => {
                    this.log("Failed to find Deconz Bridge: " + err);
                    this.log("Failed to reach Hue Bridge via default IP address. Trying Web lookup...")
                    //try to find Bridge Ip Address
                    this.discoverBridgeIp()
                        .then(discoveredIpAddress => {
                            this.log("Bridge found! IP Adress is: " + discoveredIpAddress);
                            this.verifyBridge(discoveredIpAddress)
                                .then(bridge => {
                                    resolve({url: url, bridge: bridge});
                                })
                                .catch(err => {
                                    reject(err);
                                })
                        })
                        .catch(err => {
                            console.warn("Failed to find Hue Bridge. Is your Bridge connected?");
                            reject(err)
                        })
                })
        })
    }

    verifyBridge(url){
        return new Promise(function(resolve, reject){
            if(url) {
                httpGet(url + "/api/config")
                    .then(result => {
                        //successfull. Return bridge info
                        resolve(result);
                    })
                    .catch(error => {
                        reject(error);
                    })
            }
            else reject(errMsg + "No url specified.")
        })
    }

    authBridge(){
        return new Promise((resolve, reject) => {
            httpGet(this.BridgeUrl + "/api/" + this.BridgeUser)
                .then(result => {
                    this.log("authorization at Deconz Bridge successful.")
                    resolve(result);
                })
                .catch(error => {
                    this.log("Failed to authorize at Deconz Bridge.")
                    reject(error);
                })
        })
    }

    discoverBridgeIp(){
        return new Promise(function(resolve, reject){
            httpsGet("phoscon.de/discover",)
                .then(result=>{
                    if(result[0].internalipaddress) {
                        resolve(result[0].internalipaddress);
                    }
                    else reject()
                })
                .catch(e=> reject(e))
        })
    }

    /**
     *
     * @param lightsObject {Object} an object containing all deconz lights, with their internal id as key
     * @returns {Promise<unknown>}
     */
    addLights(lightsObject) {
        let self = this;
        return new Promise(function (resolve, reject) {
            let lightPromises = [];
            let lightIds = Object.keys(lightsObject);
            lightIds.forEach((id) => {
                /**
                 * @type {DeconzNativeLight}
                 */
                const light = lightsObject[id];
                if(light === undefined) return;
                //create unique id based on key and some other props that should not change
                const uniqueId = light.uniqueid;
                let deconzLight = new DeconzLight({
                    bridgeApi: self.BridgeApi,
                    nativeObject: light,
                    identifier: light.name,
                    lightId: id,
                    deconzLightId: id,
                    uniqueId: uniqueId,
                })
                self.lights.push(deconzLight)
                LightsService.init.then(() => {
                    lightPromises.push(LightsService.addLight(deconzLight))
                })
            })
            LightsService.init.then(() => {
                Promise.all(lightPromises)
                    .then(result => {
                        resolve(self.lights);
                    })
                    .catch(err => {
                        reject(err);
                    })
            })
        });
    }

    /**
     * create lightGroup objects from deconz groups
     * @param groupsObject {Object} an object containing all groups, with their internal id as key
     * @returns {Promise<unknown>}
     */
    addGroups(groupsObject){
        let self = this;

        return new Promise(function (resolve, reject) {

            let promises = [];
            let groupIds = Object.keys(groupsObject);
            groupIds.forEach(function (id) {
                /**
                 * @type {DeconzNativeLightGroup}
                 */
                const group = groupsObject[id];
                if(group === undefined) return;
                //create unique id based on key and some other props that should not change
                const uniqueId = "DeconzLightGroup--" + group.id;

                let sceneIds = group.scenes.map(scene => scene.id);

                let deconzGroup = new DeconzLightGroup({
                    bridgeApi: self.BridgeApi,
                    nativeObject: group,
                    identifier: group.name,
                    groupId: id,
                    uniqueId: uniqueId
                })
                self.groups.push(deconzGroup)
                LightsService.init.then(() => {
                    promises.push(LightsService.addGroup(deconzGroup))
                })
            })
            LightsService.init.then(() => {
                Promise.all(promises)
                    .then(result => {
                        resolve(self.groups);
                    })
                    .catch(err => {
                        reject(err);
                    })
            })
        });
    }

    /**
     *
     * @param {Object} sensorsObject
     * @returns {Promise<unknown>}
     */
    async addSensors(sensorsObject) {
        return new Promise( (resolve, reject) => {
            let sensorPromises = [];
            let sensorIds = Object.keys(sensorsObject);
            sensorIds.forEach(
                /**
                 *
                 * @param {string} id
                 */
                (id) => {
                /**
                 * @type {DeconzNativeSensor}
                 */
                const entity = sensorsObject[id];
                if(entity === undefined) return;
                //create unique id based on key and some other props that should not change
                const uniqueId = entity.uniqueid;
                let deconzSensor = new DeconzSensor({
                    bridgeApi: this.BridgeApi,
                    nativeObject: entity,
                    identifier: entity.name,
                    sensorId: id,
                    uniqueId: uniqueId,
                })
                this.sensors.push(deconzSensor)
                SensorService.init.then(() => {
                    sensorPromises.push(SensorService.addSensor(deconzSensor))
                })
            })
            SensorService.init.then(() => {
                Promise.all(sensorPromises)
                    .then(result => {
                        resolve(this.sensors);
                    })
                    .catch(err => {
                        reject(err);
                    })
            })
        });
    }

    addScenesFromGroups(groupsArray) {
        let self = this;
        return new Promise(function (resolve, reject) {
            let promises = [];

            groupsArray.forEach(group => {
                const scenes = group.nativeObject.scenes;
                Object.keys(scenes).forEach(function (id) {
                    const scene = scenes[id];
                    if(scene === undefined) return;
                    //create unique id based on key and some other props that should not change
                    const uniqueId = "deconzScene--group-" + group.id + "--scene-" +scene.id;
                    let deconzScene = new DeconzLightScene({
                        bridgeApi: self.BridgeApi,
                        hueObject: scene,
                        identifier: scene.name,
                        sceneId: scene.id,
                        uniqueId: uniqueId,
                        deconzGroup: group,
                    })
                    self.scenes.push(deconzScene)
                    LightsService.init.then(() => {
                        promises.push(LightsService.addScene(deconzScene))
                    })
                })
                LightsService.init.then(() => {
                    Promise.all(promises)
                        .then(result => {
                            resolve(self.scenes);
                        })
                        .catch(err => {
                            reject(err);
                        })
                })
            })

        });
    }

    addLightsToGroups(groupArray) {
        let self = this;
        return new Promise(function (resolve, reject) {
            let p = [];
            groupArray.forEach((group) => {
                const uniqueId = group.uniqueId;
                const array = []
                group.nativeObject.lights.forEach(lightId => {
                    //find light
                    let light = self.lights.find(
                        /**
                         *
                         * @param {Light} light
                         * @returns {boolean}
                         */
                        light => {
                        return light.lightId === lightId
                    });
                    if(light) array.push(light.uniqueId);
                })
                p.push(LightsService.addLightsToGroup({groupUniqueId: uniqueId, lightUniqueIdArray: array}))
            })
            Promise.all(p)
                .then(result => {

                    resolve(result)
                })
                .catch(err => {
                    reject(err);
                })
        })
    }
}

