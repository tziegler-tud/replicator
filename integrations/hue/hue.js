import https from 'https';
import http from 'http';
import fetch from 'node-fetch';
import EventSource from "eventsource";
import Integration from "../Integration.js";
import LightsService from "../../services/LightsService.js";

import HueLight from "./entities/HueLight.js"
import GroupedLight from "./entities/GroupedLight.js"
import HueLightGroup from "./entities/HueLightGroup.js"
import HueLightScene from "./entities/HueLightScene.js"

export default class HueIntegration extends Integration {
    constructor({BridgeUrl, BridgeUser}={}){
        super();
        this.uniqueName = "hue";
        this.readableName = "Phillips Hue Integration";
        this.integration = {
            type: "Phillips Hue",
            data: {

            }
        }
        this.locations = [];
        this.lights = [];
        this.groups = [];
        this.grouped_lights = [];
        this.scenes = [];
        this.sensors = [];

        this.lightObjects = [];
        this.groupObjects = [];
        this.sceneObjects = [];

        this.BridgeUrl = BridgeUrl;
        this.BridgeUser = BridgeUser;
        this.initStarted = false;

    }
    initFunc({BridgeUrl, BridgeUser}){
        let self = this;
        this.locations = [];
        this.lights = [];
        this.groups = [];
        this.grouped_lights = [];
        this.scenes = [];
        this.sensors = [];

        this.lightObjects = [];
        this.groupObjects = [];
        this.sceneObjects = [];

        if(BridgeUrl) this.BridgeUrl = BridgeUrl;
        if(BridgeUser) this.BridgeUser = BridgeUser;
        const errMsg = "Failed to load " + this.readableName;
        console.log("Loading " + this.readableName + "...");
        this.Bridge = undefined;
        //try to reach the bridge
        return new Promise(function(resolve, reject){
            checkBridge(self.BridgeUrl)
                .then(checkResult => {
                    self.BridgeUrl = checkResult.url;
                    self.Bridge = checkResult.bridge;
                    //check user auth
                    authBridge(self.BridgeUrl, self.BridgeUser)
                        .then(result => {
                            self.BridgeApi = new BridgeApiV2(self.BridgeUrl, self.BridgeUser);
                            //find lights
                            let lightsPromise = self.BridgeApi.getLights();
                            let groupsPromise = self.BridgeApi.getGroups();
                            let roomsPromise = self.BridgeApi.getRooms();
                            let zonesPromise = self.BridgeApi.getZones();
                            // let groupsArrayPromise = self.BridgeApi.getGroupsArray();
                            let scenesPromise = self.BridgeApi.getScenes();
                            let sensorsPromise = self.BridgeApi.getSensors();

                            Promise.all([lightsPromise, groupsPromise, roomsPromise, zonesPromise, scenesPromise, sensorsPromise])
                                .then(result => {
                                    const lights = result[0];
                                    const groups = result[1];
                                    const rooms = result[2];
                                    const zones = result[3];
                                    const scenes = result[4];
                                    const sensors = result[5];

                                    self.lights = lights;
                                    self.grouped_lights = groups;
                                    self.rooms = rooms;
                                    self.zones = zones;
                                    self.scenes = scenes;
                                    self.sensors = sensors;

                                    //add lights to runtime
                                    let lightsPromise = self.addLights(lights)
                                    let zonesPromise = self.addZones(zones)
                                    let groupsPromise = self.addGroups(rooms);
                                    let scenesPromise = self.addScenes(scenes);

                                    Promise.all([lightsPromise, groupsPromise, scenesPromise])
                                        .then(result => {
                                            const groups = result[1]
                                            self.addLightsToGroups(groups)
                                                .then(()=> {
                                                    self.addScenesToGroups(groups)
                                                        .then(result => {
                                                            console.log("Phillips Hue Integration initialized successfully. Bridge IP: " + self.BridgeUrl);
                                                            //subscribe to eventstream
                                                            const eventSource = self.BridgeApi.getEventSource();
                                                            const eventStreamHandler = new EventStreamHandler(self);
                                                            eventSource.addEventListener('update', (event)=>{eventStreamHandler.update(event)});
                                                            eventSource.addEventListener('add', (event)=>{eventStreamHandler.add(event)});
                                                            eventSource.addEventListener('delete', (event)=>{eventStreamHandler.delete(event)});
                                                            eventSource.addEventListener('error', (event)=>{eventStreamHandler.error(event)});
                                                            eventSource.addEventListener('message', (event)=>{eventStreamHandler.message(event)});
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
                        .catch(err => {
                            reject(errMsg + err)
                        })
                })
                .catch(err => {
                    reject(errMsg + err)
                })
        })

    }

    addLightsV1() {
        let self = this;
        return new Promise(function (resolve, reject) {
            LightsService.init.then(() => {
                let lightPromises = [];
                Object.keys(self.lights).forEach(function (key) {
                    const light = self.lights[key];
                    //create unique id based on key and some other props that should not change
                    const uniqueId = light.uniqueid;
                    let hueLight = new HueLight({
                        bridgeApi: self.BridgeApi,
                        hueState: light.state,
                        identifier: light.name,
                        lightId: key,
                        uniqueId: uniqueId,
                    })
                    lightPromises.push(LightsService.addLight(hueLight))
                })
                Promise.all(lightPromises)
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            })
        });
    }

    addGroupsV1(){
        let self = this;
        return new Promise(function(resolve, reject){
            LightsService.init.then(() => {
                let promises = [];
                Object.keys(self.groups).forEach(function (key) {
                    const group = self.groups[key];
                    //create unique id based on key and some other props that should not change
                    const uniqueId = "HueGroup-" + group.type + "-" + key;
                    group.uniqueId = uniqueId;
                    let hueGroup = new HueLightGroup({
                        bridgeApi: self.BridgeApi,
                        hueState: group.state,
                        identifier: group.name,
                        groupId: key,
                        uniqueId: uniqueId,
                    })
                    promises.push(LightsService.addGroup(hueGroup))
                })
                Promise.all(promises)
                    .then(result => {
                        resolve(result)
                    })
                    .catch(err => {
                        reject(err);
                    })
            })
        })
    }

    addLightsToGroupsV1(){
        let self = this;
        return new Promise(function(resolve, reject){
            Object.keys(self.groups).forEach(function(key){
                const group = self.groups[key];
                const uniqueId = group.uniqueId;
                const array = group.lights.map(lightId => {
                    return self.lights[lightId].uniqueid
                })
                LightsService.addLightsToGroup({groupUniqueId: uniqueId, lightUniqueIdArray: array})
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            })
        })


    }

    getResource(uniqueId){
        //check lights
        let resources = [...this.lightObjects, ...this.groupObjects, ...this.sceneObjects];
        return resources.find(o => o.uniqueId === uniqueId);
    }
    addLights(lightsArray) {
        let self = this;
        return new Promise(function (resolve, reject) {
            let lightPromises = [];
            lightsArray.forEach(function (light) {
                //create unique id based on key and some other props that should not change
                const uniqueId = light.id;
                let hueLight = new HueLight({
                    bridgeApi: self.BridgeApi,
                    hueObject: light,
                    identifier: light.metadata.name,
                    lightId: light.id,
                    uniqueId: uniqueId,
                })
                self.lightObjects.push(hueLight)
                LightsService.init.then(() => {
                    lightPromises.push(LightsService.addLight(hueLight))
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
     * create lightGroup objects from hue rooms
     * Note: API v2 seperates rooms and light_groups into different entities. We will use rooms to create the lightGroup, but call the associated light_group service to handle states.
     * @param groupArray
     * @returns {Promise<unknown>}
     */
    addGroups(groupArray){
        let self = this;

        return new Promise(function (resolve, reject) {

            let promises = [];
            groupArray.forEach(function (group) {
                //create unique id based on key and some other props that should not change
                const uniqueId = group.id;
                // find associated grouped_light
                const groupedLightId = group.services.find(service => service.rtype === "grouped_light").rid;
                const groupedLightJSON = self.grouped_lights.find(grouped_light => {
                    return grouped_light.id === groupedLightId;
                })

                //find associated scenes
                let scenes = self.scenes.filter(function(scene){
                    return scene.group.rtype === "room" && scene.group.rid === group.id;
                })

                let sceneIds = scenes.map(scene => scene.id);

                let groupedLight = new GroupedLight({
                    bridgeApi: self.BridgeApi,
                    hueObject: groupedLightJSON,
                    identifier: "HueGroupedLight_"+groupedLightJSON.id,
                    lightId: groupedLightJSON.id,
                    uniqueId: groupedLightJSON.id,
                })
                let hueGroup = new HueLightGroup({
                    bridgeApi: self.BridgeApi,
                    hueObject: group,
                    identifier: group.metadata.name,
                    groupId: group.id,
                    uniqueId: uniqueId,
                    groupedLight: groupedLight,
                    hueScenes: sceneIds,
                })
                self.groupObjects.push(hueGroup)
                LightsService.init.then(() => {
                    promises.push(LightsService.addGroup(hueGroup))
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

    /**
     * create lightGroup objects from hue zones
     * Note: API v2 seperates rooms and light_groups into different entities. We will use rooms to create the lightGroup, but call the associated light_group service to handle states.
     * @param zoneArray
     * @returns {Promise<unknown>}
     */
    addZones(zoneArray){
        let self = this;

        return new Promise(function (resolve, reject) {

            let promises = [];
            zoneArray.forEach(function (group) {
                //create unique id based on key and some other props that should not change
                const uniqueId = group.id;
                // find associated grouped_light
                const groupedLightId = group.services.find(service => service.rtype === "grouped_light").rid;
                const groupedLightJSON = self.grouped_lights.find(grouped_light => {
                    return grouped_light.id === groupedLightId;
                })

                //find associated scenes
                let scenes = self.scenes.filter(function(scene){
                    return scene.group.rtype === "zone" && scene.group.rid === group.id;
                })

                let sceneIds = scenes.map(scene => scene.id);

                let groupedLight = new GroupedLight({
                    bridgeApi: self.BridgeApi,
                    hueObject: groupedLightJSON,
                    identifier: "HueGroupedLight_"+groupedLightJSON.id,
                    lightId: groupedLightJSON.id,
                    uniqueId: groupedLightJSON.id,
                })
                let hueGroup = new HueLightGroup({
                    bridgeApi: self.BridgeApi,
                    hueObject: group,
                    identifier: group.metadata.name,
                    groupId: group.id,
                    uniqueId: uniqueId,
                    groupedLight: groupedLight,
                    hueScenes: sceneIds,
                })
                self.groupObjects.push(hueGroup)
                LightsService.init.then(() => {
                    promises.push(LightsService.addGroup(hueGroup))
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

    addScenes(scenesArray) {
        let self = this;
        return new Promise(function (resolve, reject) {
            let promises = [];
            scenesArray.forEach(function (scene) {
                //create unique id based on key and some other props that should not change
                const uniqueId = scene.id;
                let hueScene = new HueLightScene({
                    bridgeApi: self.BridgeApi,
                    hueObject: scene,
                    identifier: scene.metadata.name,
                    sceneId: scene.id,
                    uniqueId: uniqueId,
                })
                self.sceneObjects.push(hueScene)
                LightsService.init.then(() => {
                    promises.push(LightsService.addScene(hueScene))
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
        });
    }

    addLightsToGroups(groupArray) {
        let self = this;
        return new Promise(function (resolve, reject) {
            let p = [];
            groupArray.forEach(function (group) {
                const uniqueId = group.uniqueId;
                const array = []
                group.nativeObject.children.forEach(child => {
                    if (child.rtype === "device"){
                        //find light
                        let light = self.lightObjects.find(light => {
                            return light.nativeObject.owner.rid === child.rid
                        });
                        if(light) array.push(light.uniqueId);
                    }
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
    addScenesToGroups(groupArray) {
        let self = this;
        return new Promise(function (resolve, reject) {
            groupArray.forEach(function (group) {
                const uniqueId = group.uniqueId;
                LightsService.addScenesToGroup({groupUniqueId: uniqueId, sceneUniqueIdArray: group.hueScenes})
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => {
                        reject(err);
                    })
            })
        })
    }
}

class BridgeApiV2 {
    constructor(url, user){
        this.url = url;
        this.user = user;
        this.address = "https://" + this.url + "/clip/v2/";

        this.httpsAgent = new https.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
            keepAliveMsecs: 100000,
            maxSockets: 2,
        });
        this.headers = {
            "hue-application-key": user,
        }
        this.defaultOptions = {
            method: "GET",
            headers: this.headers,
            agent: this.httpsAgent,
        }
    }
    get(path, options = {}){
        let self = this;
        return new Promise(function(resolve, reject){
            let op = Object.assign(options, self.defaultOptions);
            fetch(self.address + path, op)
                .then(response => {
                    if (response.ok) {
                        // response.status >= 200 && response.status < 300
                        const contentType = response.headers.get('content-type');
                        if (/^application\/json/.test(contentType)) {
                            response.json()
                                .then(json => {
                                    resolve(json)
                                })
                                .catch(err => {
                                    reject(err);
                                })
                        }
                        else {
                            resolve(response)
                        }
                    } else {
                        reject(response);
                    }

                })
        })
    }

    post(path, data={}, options = {}){
        let self = this;
        return new Promise(function(resolve, reject) {
            const postHeaders = {'Content-Type': 'application/json'};
            let op = Object.assign(options, self.defaultOptions);
            op.headers = Object.assign(op.headers, postHeaders);
            op.method = "POST";
            op.body = JSON.stringify(data);
            fetch(self.address + path, op)
                .then(response => {
                    if (response.ok) {
                        // response.status >= 200 && response.status < 300
                        const contentType = response.headers.get('content-type');
                        if (/^application\/json/.test(contentType)) {
                            response.json()
                                .then(json => {
                                    resolve(json)
                                })
                                .catch(err => {
                                    reject(err);
                                })
                        } else {
                            resolve(response)
                        }
                    } else {
                        reject(response);
                    }

                })
        })
    }
    put(path, data = {}, options = {}){
        let self = this;
        return new Promise(function(resolve, reject) {
            const postHeaders = {'Content-Type': 'application/json'};
            let op = Object.assign(options, self.defaultOptions);
            op.headers = Object.assign(op.headers, postHeaders);
            op.method = "PUT";
            op.body = JSON.stringify(data);
            fetch(self.address + path, op)
                .then(response => {
                    if (response.ok) {
                        // response.status >= 200 && response.status < 300
                        const contentType = response.headers.get('content-type');
                        if (/^application\/json/.test(contentType)) {
                            response.json()
                                .then(json => {
                                    resolve(json)
                                })
                                .catch(err => {
                                    reject(err);
                                })
                        } else {
                            resolve(response)
                        }
                    } else {
                        reject(response);
                    }

                })
        })
    }

    getLights(){
        let self = this;
        return new Promise(function (resolve, reject){
            self.get("resource/light")
                .then(result => {
                    if(result.errors.length > 0) {
                        reject(result.errors);
                    }
                    else {
                        resolve(result.data);
                    }
                })
        });

    }

    getGroups(){
        let self = this;
        return new Promise(function (resolve, reject){
            self.get("resource/grouped_light")
                .then(result => {
                    if(result.errors.length > 0) {
                        reject(result.errors);
                    }
                    else {
                        resolve(result.data);
                    }
                })
        });
    }

    getRooms(){
        let self = this;
        return new Promise(function (resolve, reject){
            self.get("resource/room")
                .then(result => {
                    if(result.errors.length > 0) {
                        reject(result.errors);
                    }
                    else {
                        resolve(result.data);
                    }
                })
        });
    }

    getZones(){
        let self = this;
        return new Promise(function (resolve, reject){
            self.get("resource/zone")
                .then(result => {
                    if(result.errors.length > 0) {
                        reject(result.errors);
                    }
                    else {
                        resolve(result.data);
                    }
                })
        });
    }

    getScenes(){
        let self = this;
        return new Promise(function (resolve, reject){
            self.get("resource/scene")
                .then(result => {
                    if(result.errors.length > 0) {
                        reject(result.errors);
                    }
                    else {
                        resolve(result.data);
                    }
                })
        });
    }

    getSensors(){
        let self = this;
        return new Promise(function (resolve, reject){
            let motion = self.get("resource/motion");
            let temperature = self.get("resource/temperature");
            let lightLevel = self.get("resource/light_level");
            Promise.all([motion, temperature, lightLevel])
                .then(results => {
                    const motionResult = results[0];
                    results[0].type = "motion";
                    const temperatureResult = results[1];
                    results[1].type = "temperature";
                    const lightLevelResult = results[2];
                    results[2].type = "light_level";


                    let sensors = []

                    results.forEach(result => {
                        if(result.errors.length > 0) {
                            reject(result.errors);
                        }
                        else {
                            sensors[result.type] = result.data;
                        }
                    })
                    resolve(sensors);
                })
                .catch(err => {
                    reject(err)
                })
        });

    }
    getLightState(lightId) {
        let self = this;
        return new Promise(function(resolve, reject){
            self.get("resource/light/"+lightId)
                .then(result => {
                    if(result.errors.length > 0) {
                        reject(result.errors);
                    }
                    else {
                        if(result.data.length !== 1) {
                            reject("No light found");
                        }
                        else resolve(result.data[0]);
                    }
                })
        });
    }
    setLightState(lightId, state) {
        return this.put("resource/light/"+lightId, state);
    }

    getGroupedLightState(lightId) {
        let self = this;
        return new Promise(function(resolve, reject){
            self.get("resource/grouped_light/"+lightId)
                .then(response => {
                    if(response.errors.length > 0) {
                        reject(response.errors)
                    }
                    else {
                        resolve(response.data[0]);
                    }
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    setGroupedLightState(lightId, state) {
        return this.put("resource/grouped_light/"+lightId, state);
    }

    activateScene(sceneId){
        return this.put("resource/scene/"+sceneId, {
            recall: {
                action: "active",
            }
        })
    }

    getEventSource(){
        let headers = {
            'hue-application-key': this.headers["hue-application-key"],
            'Accept': "text/event-stream",
        }
        let url = "https://" + this.url + "/eventstream/clip/v2";
        var eventSourceInitDict = {headers: headers};
        var es = new EventSource(url, eventSourceInitDict);
        return es;
    }
}

class EventStreamHandler {
    constructor(integration){
        this.integration = integration;
    }
    add(event){
        this.log(event)
    }
    update(event){
        this.log(event)
    }
    delete(event){
        this.log(event)
    }
    error(event){
        this.log(event)
    }
    message(event){
        // this.log(event);
        const data = JSON.parse(event.data);
        data.forEach(event => {
            let hueEvent = new HueEvent(event);
            switch(hueEvent.type){
                case "add":
                    return this.addEvent(hueEvent);
                case "update":
                    return this.updateEvent(hueEvent);
                case "delete":
                    return this.deleteEvent(hueEvent);
                case "error":
                default:
                    return this.errorEvent(hueEvent);
            }
        })
    }
    log(event){
        console.log("HueIntegration: Received event: Type: " + event.type + " data: " + event.data.toString());
    }

    addEvent(hueEvent){
        console.log("HueIntegration: something was added!");
    }
    updateEvent(hueEvent){
        const self = this;
        //identify updated resources
        const modifiedResources = hueEvent.getModifiedResources();
        //get resources
        if(modifiedResources.length > 0){
            console.log("HueIntegration: "+ modifiedResources.length + " resources were updated!")
            modifiedResources.forEach(resource => {
                let entity = self.integration.getResource(resource.uniqueId);
                if(entity) {
                    entity.setInternalState(resource.data)
                }
            })
        }
    }
    deleteEvent(hueEvent){
        console.log("HueIntegration: something was deleted!")
        // return this.integration.reload();
    }
    errorEvent(hueEvent){
        console.log("HueIntegration: Error received:");
        this.log(hueEvent);

    }
}

class HueEvent{
    constructor(eventData){
        this.id = eventData.id;
        this.type = eventData.type;
        this.data = eventData.data;
        this.creationTime = eventData.creationTime;
    }

    getModifiedResources(){
        let resources = [];
        this.data.forEach(dataset => {
            resources.push({
                type: dataset.type,
                uniqueId: dataset.id,
                data: dataset,
            });
        })
        return resources;
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