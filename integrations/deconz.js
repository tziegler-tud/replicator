import https from 'https';
import http from 'http';
import Integration from "./Integration.js";
import LightsService from "../services/LightsService.js";

export default class DeconzIntegration extends Integration {
    constructor({BridgeUrl, BridgeUser}={}){
        super();
        this.readableName = "Deconz Api Integration"
        this.integration = {
            type: "Phillips Hue",
            data: {

            }
        }
        this.locations = [];
        this.lights = [];

        this.BridgeUrl = BridgeUrl;
        this.BridgeUser = BridgeUser;
        this.initStarted = false;

    }
    async initFunc({BridgeUrl, BridgeUser}){
        let self = this;
        if(BridgeUrl) this.BridgeUrl = BridgeUrl;
        if(BridgeUser) this.BridgeUser = BridgeUser;
        const errMsg = "Failed to load Phillips Hue Integration: "
        console.log("Loading " + this.readableName + "...");
        // this.BridgeUrl = "192.168.1.102";
        this.Bridge = undefined;
        //try to reach the bridge
        checkBridge(self.BridgeUrl)
            .then(checkResult => {
                self.BridgeUrl = checkResult.url;
                self.Bridge = checkResult.bridge;
                //check user auth
                authBridge(self.BridgeUrl, self.BridgeUser)
                    .then(result => {
                        self.BridgeApi = new BridgeApi(self.BridgeUrl, self.BridgeUser);
                        //find lights
                        let lightsPromise = self.BridgeApi.get("lights");
                        let groupsPromise = self.BridgeApi.get("groups");
                        // let groupsArrayPromise = self.BridgeApi.getGroupsArray();
                        let scenesPromise = self.BridgeApi.get("scenes");
                        let sensorsPromise = self.BridgeApi.get("sensors");

                        Promise.all([lightsPromise, groupsPromise, scenesPromise, sensorsPromise])
                            .then(result => {
                                self.lights = result[0];
                                self.groups = result[1];
                                self.scenes = result[2];
                                self.sensors = result[3];

                                //add lights to runtime
                                let lightPromises = [];
                                let groupPromises = [];
                                let groupAddPromises = [];

                                LightsService.init.then(()=>{
                                    Object.keys(self.lights).forEach(function (key) {
                                        const light = self.lights[key];
                                        //create unique id based on key and some other props that should not change
                                        const uniqueId = light.uniqueid;
                                        lightPromises.push(LightsService.addLight({uniqueId: uniqueId, identifier: light.name, integration: self.getIntegration(light), state: light.state}))
                                    })
                                    Promise.all(lightPromises)
                                        .then(lightResults => {
                                            //add groups to runtime
                                            Object.keys(self.groups).forEach(function (key) {
                                                const group = self.groups[key];
                                                //create unique id based on key and some other props that should not change
                                                const uniqueId = "HueGroup-"+ group.type + "-" + key;
                                                groupPromises.push(new Promise(function(resolve, reject){
                                                    LightsService.addGroup({uniqueId: uniqueId, identifier: group.name, integration: self.getIntegration(group)})
                                                        .then(savedGroup => {
                                                            const array = group.lights.map(lightId => {
                                                                return self.lights[lightId].uniqueid
                                                            })
                                                            LightsService.addLightsToGroup({groupUniqueId: uniqueId, lightUniqueIdArray: array});
                                                            resolve();
                                                        })
                                                }))
                                            })
                                            Promise.all(groupPromises)
                                                .then(result => {
                                                    console.log("Phillips Hue Integration initialized successfully. Bridge IP: " + self.BridgeUrl);
                                                    return(self);
                                                })
                                        })

                                })
                            })
                            .catch(err => {
                                throw new Error(errMsg + err)
                            })
                    })
                    .catch(err => {
                        throw new Error(errMsg + err)
                    })
            })
            .catch(err => {
                throw new Error(errMsg + err)
            })
    }

    // getLightGroupByName(groupName) {
    //     let self = this;
    //     return new Promise(function(resolve, reject){
    //         self.init.then(function(){
    //             let result = self.groupsArray.find(group => group.group.name === groupName);
    //             resolve(result);
    //         })
    //     })
    // }

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
     * @param newState {Boolean}
     */
    setLightState(lightId, newState) {
        let state = parseState(newState);
        this.BridgeApi.setLightState(lightId, {on: state})
            .then(result => {

            })
            .catch(e => {
                return false;
            })
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

class BridgeApi {
    constructor(url, user){
        this.url = url;
        this.user = user;
    }
    get(path){
        let self = this;
        return new Promise(function(resolve, reject){
            let httpUrl = "http://" + self.url + "/api/" + self.user + "/" + path;
            http.get(httpUrl, res => {
                const { statusCode } = res;
                const contentType = res.headers['content-type'];

                let error;
                // Any 2xx status code signals a successful response but
                // here we're only checking for 200.
                if (statusCode !== 200) {
                    error = new Error('Request Failed.\n' +
                        `Status Code: ${statusCode}`);
                } else if (!/^application\/json/.test(contentType)) {
                    error = new Error('Invalid content-type.\n' +
                        `Expected application/json but received ${contentType}`);
                }
                if (error) {
                    console.error(error.message);
                    // Consume response data to free up memory
                    res.resume();
                    reject(e);
                }

                res.setEncoding('utf8');
                let rawData = '';
                res.on('data', (chunk) => { rawData += chunk; });
                res.on('end', () => {
                    try {
                        const parsedData = JSON.parse(rawData);
                        resolve(parsedData);
                    } catch (e) {
                        console.error(e.message);
                        reject(e);
                    }
                });
            }).on('error', (e) => {
                console.error(`Got error: ${e.message}`);
                reject(e);
            });
        })
    }
    post(path, data){
        let self = this;
        return new Promise(function(resolve, reject){
            let reqData = JSON.stringify(data);
            let options = {method: "POST"}
            const req = http.request("http://" + self.url + "/api/" + user + "/" + path, options,(res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`);
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                });
            });

            req.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
            });
            // Write data to request body
            req.write(reqData);
            req.end();
        })
    }
    put(path, data){
        let self = this;
        return new Promise(function(resolve, reject){
            let reqData = JSON.stringify(data);
            let options = {method: "PUT"}
            const req = http.request("http://" + self.url + "/api/" + self.user + "/" + path, options,(res) => {
                console.log(`STATUS: ${res.statusCode}`);
                console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
                res.setEncoding('utf8');
                res.on('data', (chunk) => {
                    console.log(`BODY: ${chunk}`);
                });
                res.on('end', () => {
                    console.log('No more data in response.');
                });
            });

            req.on('error', (e) => {
                console.error(`problem with request: ${e.message}`);
            });
            // Write data to request body
            req.write(reqData);
            req.end();
        })
    }
    getGroupsArray(){
        let self = this;
        return new Promise(function(resolve, reject) {
            self.get("groups")
                .then(groupsObject => {
                    let groupsArray = [];
                    Object.keys(groupsObject).forEach(function (key) {
                        groupsArray.push({id: key, group: groupsObject[key]});
                    })
                    resolve(groupsArray);
                })
                .catch(e => {
                    reject(e);
                })
        })
    }
    getLightState(lightId) {
        return this.get("lights/"+lightId);
    }
    setLightState(lightId, state) {
        return this.put("lights/"+lightId + "/state", state);
    }

    getGroupState(groupId) {
        return this.get("groups/"+groupId);
    }

    setGroupState(groupId, state) {
        return this.put("groups/"+groupId + "/action", state);
    }
    getScenes(){
        return this.get("scenes");
    }
    setGroupScene(groupId, sceneId) {
        return this.put("groups/"+groupId + "/action", sceneId)
    }
}

function checkBridge(url) {
    let self = this;
    return new Promise(function(resolve, reject){
        verifyBridge(url)
            .then(bridge => {
                resolve({url: url, bridge: bridge});
            })
            .catch(err => {
                console.warn("Failed to reach Hue Bridge via default IP address. Trying Web lookup...")
                //try to find Bridge Ip Address
                discoverBridgeIp()
                    .then(discoveredIpAddress => {
                        console.log("Bridge found! IP Adress is: " + discoveredIpAddress);
                        verifyBridge(discoveredIpAddress)
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

function verifyBridge(url){
    const errMsg = "Failed to find Hue Bridge: ";
    return new Promise(function(resolve, reject){
        if(url) {
            httpGet(url + "/api/0/config")
                .then(result => {
                    //successfull. Return bridge info
                    console.log("Hue Bridge discovered successfully.")
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

function authBridge(bridgeUrl, bridgeUser){
    return new Promise(function(resolve, reject){
        httpGet(bridgeUrl + "/api/" + bridgeUser)
            .then(result => {
                //successfull.
                console.log("authorization at Hue Bridge successful.")
                resolve(result);
            })
            .catch(error => {
                console.log("Failed to authorize at Hue Bridge.")
                reject(error);
            })
    })
}


function getBridgeLights(bridgeUrl, bridgeUser){
    return new Promise(function(resolve, reject){
        httpGet(bridgeUrl + "/api/" + bridgeUser + "/lights")
            .then(result => {
                resolve(result);
            })
            .catch(error => {
                reject(error);
            })
    })
}

function discoverBridgeIp(){
    return new Promise(function(resolve, reject){
        httpsGet("discovery.meethue.com",)
            .then(result=>{
                if(result[0].internalipaddress) {
                    resolve(result[0].internalipaddress);
                }
                else reject()
            })
            .catch(e=> reject(e))
    })
}

function httpsGet(url){
    return new Promise(function(resolve, reject){
        https.get("https://" + url, res => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            let error;
            // Any 2xx status code signals a successful response but
            // here we're only checking for 200.
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' +
                    `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' +
                    `Expected application/json but received ${contentType}`);
            }
            if (error) {
                console.error(error.message);
                // Consume response data to free up memory
                res.resume();
                reject(e);
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    //try to find local IP adress
                    resolve(parsedData);
                } catch (e) {
                    console.error(e.message);
                    reject(e);
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
            reject(e);
        });
    })
}


function httpGet(url){
    return new Promise(function(resolve, reject){
        let httpUrl = "http://" + url;
        http.get(httpUrl, res => {
            const { statusCode } = res;
            const contentType = res.headers['content-type'];

            let error;
            // Any 2xx status code signals a successful response but
            // here we're only checking for 200.
            if (statusCode !== 200) {
                error = new Error('Request Failed.\n' +
                    `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error('Invalid content-type.\n' +
                    `Expected application/json but received ${contentType}`);
            }
            if (error) {
                console.error(error.message);
                // Consume response data to free up memory
                res.resume();
                reject(e);
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => { rawData += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    //try to find local IP adress
                    resolve(parsedData);
                } catch (e) {
                    console.error(e.message);
                    reject(e);
                }
            });
        }).on('error', (e) => {
            console.error(`Got error: ${e.message}`);
            reject(e);
        });
    })
}

function httpRequest(url, options, data){
    return new Promise(function(resolve, reject){
        let reqData = JSON.stringify(data);
        const req = http.request("http://" + url, options,(res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
            });
            res.on('end', () => {
                console.log('No more data in response.');
            });
        });

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });
        // Write data to request body
        req.write(reqData);
        req.end();
    })
}

function httpsRequest(url, options, data){
    return new Promise(function(resolve, reject){
        let reqData = JSON.stringify(data);
        const req = https.request("https://" + url, options,(res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                console.log(`BODY: ${chunk}`);
            });
            res.on('end', () => {
                console.log('No more data in response.');
            });
        });

        req.on('error', (e) => {
            console.error(`problem with request: ${e.message}`);
        });
        // Write data to request body
        req.write(reqData);
        req.end();
    })
}

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

function normalizeBrightness(brightness) {
    if(typeof brightness !== "number") {
        brightness = parseInt(brightness);
    }
    if (brightness > 254) return 254;
    if (brightness < 0) return 0;
    return brightness;
}

function parseState(state){
    if(state === undefined) return false;
    switch(typeof state){
        case "string":
            if(state.toUpperCase() === "off".toUpperCase()) return LightsService.STATES.OFF;
            if(state.toUpperCase() === "on".toUpperCase()) return LightsService.STATES.ON;
            else return false;
            break;
        case "object":
            if(state.toString().toUpperCase() === "off".toUpperCase()) return LightsService.STATES.OFF;
            if(state.toString().toUpperCase() === "on".toUpperCase()) return LightsService.STATES.ON;
            else return false;
            break;
        case "boolean":
            return state;
        default:
            return false;
    }
}