import https from 'https';
import http from 'http';
import Integration, {httpGet, httpsGet} from "../Integration.js";
import LightsService from "../../services/LightsService.js";
import DeconzBridgeApi from "./DeconzBridgeApi.js"
import DeconzLight from "./entities/DeconzLight.js";
import DeconzLightGroup from "./entities/DeconzLightGroup.js";
import HueLightScene from "../hue/entities/HueLightScene.js";
import DeconzLightScene from "./entities/DeconzLightScene.js";

export default class DeconzIntegration extends Integration {
    constructor({BridgeUrl, ApiKey} = {}) {
        super();
        this.readableName = "Deconz Api Integration"
        this.integration = {
            type: "Deconz",
            data: {}
        }
        this.locations = [];
        this.lights = [];

        this.lightObjects = [];
        this.groupObjects = [];
        this.sceneObjects = [];

        this.BridgeUrl = BridgeUrl;
        this.apiKey = ApiKey;
        this.initStarted = false;

    }

    async initFunc({BridgeUrl, BridgeUser}) {
        let self = this;
        if (BridgeUrl) this.BridgeUrl = BridgeUrl;
        if (BridgeUser) this.BridgeUser = BridgeUser;
        const errMsg = "Failed to load " + this.readableName + ": ";
        console.log("Loading " + this.readableName + "...");

        //try to reach the bridge
        return new Promise((resolve, reject) => {
            this.checkBridge(self.BridgeUrl)
                .then(checkResult => {
                    self.BridgeUrl = checkResult.url;
                    self.Bridge = checkResult.bridge;
                    //check user auth
                    this.authBridge()
                        .then(fullConfiguration => {
                            self.BridgeApi = new DeconzBridgeApi(self.BridgeUrl, self.BridgeUser);

                            let lightsPromise = self.BridgeApi.getLights();
                            let groupsPromise = self.BridgeApi.getGroups();
                            let sensorsPromise = self.BridgeApi.getSensors();

                            Promise.all([lightsPromise, groupsPromise, sensorsPromise])
                                .then(result => {
                                    const lights = result[0];
                                    const groups = result[1];
                                    const sensors = result[2];

                                    self.lights = lights;
                                    self.groups = groups;
                                    self.sensors = sensors;

                                    //add lights to runtime
                                    let lightsPromise = self.addLights(lights)
                                    let groupsPromise = self.addGroups(groups);
                                    // let sensorsPromise = self.addSensors(sensors);


                                    Promise.all([lightsPromise, groupsPromise])
                                        .then(result => {
                                            const groups = result[1]
                                            self.addLightsToGroups(groups)
                                                .then(() => {
                                                    self.addScenesFromGroups(groups)
                                                        .then(result => {
                                                            // console.log("Phillips Hue Integration initialized successfully. Bridge IP: " + self.BridgeUrl);
                                                            // //subscribe to eventstream
                                                            // const eventSource = self.BridgeApi.getEventSource();
                                                            // const eventStreamHandler = new EventStreamHandler(self);
                                                            // eventSource.addEventListener('update', (event) => {
                                                            //     eventStreamHandler.update(event)
                                                            // });
                                                            // eventSource.addEventListener('add', (event) => {
                                                            //     eventStreamHandler.add(event)
                                                            // });
                                                            // eventSource.addEventListener('delete', (event) => {
                                                            //     eventStreamHandler.delete(event)
                                                            // });
                                                            // eventSource.addEventListener('error', (event) => {
                                                            //     eventStreamHandler.error(event)
                                                            // });
                                                            // eventSource.addEventListener('message', (event) => {
                                                            //     eventStreamHandler.message(event)
                                                            // });
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
                    resolve({url: url, bridge: bridge});
                })
                .catch(err => {
                    console.warn("Failed to reach Hue Bridge via default IP address. Trying Web lookup...")
                    //try to find Bridge Ip Address
                    this.discoverBridgeIp()
                        .then(discoveredIpAddress => {
                            console.log("Bridge found! IP Adress is: " + discoveredIpAddress);
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
        const errMsg = "Failed to find Deconz Bridge: ";
        return new Promise(function(resolve, reject){
            if(url) {
                httpGet(url + "/api/config")
                    .then(result => {
                        //successfull. Return bridge info
                        console.log("Deconz Bridge discovered successfully.")
                        resolve(result);
                    })
                    .catch(error => {
                        console.log(errMsg);
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
                    console.log("authorization at Deconz Bridge successful.")
                    resolve(result);
                })
                .catch(error => {
                    console.log("Failed to authorize at Deconz Bridge.")
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
            lightIds.forEach(function (id) {
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
                self.lightObjects.push(deconzLight)
                LightsService.init.then(() => {
                    lightPromises.push(LightsService.addLight(deconzLight))
                })
            })
            LightsService.init.then(() => {
                Promise.all(lightPromises)
                    .then(result => {
                        resolve(self.lightObjects);
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
                const group = groupsObject[id];
                if(group === undefined) return;
                //create unique id based on key and some other props that should not change
                const uniqueId = "DeconzLightGroup--" + group.id;

                let sceneIds = group.scenes.map(scene => scene.id);

                let deconzGroup = new DeconzLightGroup({
                    bridgeApi: self.BridgeApi,
                    nativeObject: group,
                    identifier: group.name,
                    groupId: group.id,
                    uniqueId: uniqueId
                })
                self.groupObjects.push(deconzGroup)
                LightsService.init.then(() => {
                    promises.push(LightsService.addGroup(deconzGroup))
                })
            })
            LightsService.init.then(() => {
                Promise.all(promises)
                    .then(result => {
                        resolve(self.groupObjects);
                    })
                    .catch(err => {
                        reject(err);
                    })
            })
        });
    }

    async addSensors(sensorsObject) {
        return true
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
                    const uniqueId = "deconzScene--" +scene.id;
                    let deconzScene = new DeconzLightScene({
                        bridgeApi: self.BridgeApi,
                        hueObject: scene,
                        identifier: scene.name,
                        sceneId: scene.id,
                        uniqueId: uniqueId,
                        deconzGroup: group,
                    })
                    self.sceneObjects.push(deconzScene)
                    LightsService.init.then(() => {
                        promises.push(LightsService.addScene(deconzScene))
                    })
                })
                LightsService.init.then(() => {
                    Promise.all(promises)
                        .then(result => {
                            resolve(self.sceneObjects);
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
            groupArray.forEach(function (group) {
                const uniqueId = group.uniqueId;
                const array = []
                group.nativeObject.lights.forEach(lightId => {
                    //find light
                    let light = self.lightObjects.find(light => {
                        return light.deconzLightId === lightId
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

