import http from "http";
import fetch from "node-fetch";
import EventSource from "eventsource";

export default class DeconzBridgeApi {
    constructor({host, port=80, apiKey}){
        this.url = host;
        this.port = port;
        this.apiKey = apiKey;
        this.address = "http://" + this.url + ":" + this.port + "/api/" + this.apiKey;

        this.httpAgent = new http.Agent({
            rejectUnauthorized: false,
            keepAlive: true,
            keepAliveMsecs: 100000,
            maxSockets: 2,
        });
        this.headers = {
        }
        this.defaultOptions = {
            method: "GET",
            headers: this.headers,
            agent: this.httpAgent,
        }
    }

    /**
     *
     * @param path {string}
     * @param options {object}
     * @returns {Promise<unknown>}
     */
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

    /**
     *
     * @param path {string}
     * @param data {object}
     * @param options {object}
     * @returns {Promise<unknown>}
     */
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

    /**
     *
     * @param path {string}
     * @param data {object}
     * @param options {object}
     * @returns {Promise<unknown>}
     */
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
            self.get("/lights")
                .then(result => {
                    if(result.error) {
                        reject(result.error);
                    }
                    else {
                        resolve(result);
                    }
                })
                .catch(err => {
                    reject(err)
                })
        });

    }

    getGroups(){
        let self = this;
        return new Promise(function (resolve, reject){
            self.get("/groups")
                .then(result => {
                    if(result.error) {
                        reject(result.error);
                    }
                    else {
                        resolve(result);
                    }
                })
                .catch(err => {
                    reject(err)
                })
        });
    }


    getScenes(){
        let self = this;
        return new Promise(function (resolve, reject){
            self.get("/scenes")
                .then(result => {
                    if(result.error) {
                        reject(result.error);
                    }
                    else {
                        resolve(result);
                    }
                })
        });
    }

    getSensors(){
        let self = this;
        return new Promise(function (resolve, reject){
            let sensors = self.get("/sensors")
                .then(result => {
                    if(result.error) {
                        reject(result.error);
                    }
                    resolve(result);
                })
                .catch(err => {
                    reject(err)
                })
        });
    }

    /**
     *
     * @param lightId
     * @returns {Promise<Object>}
     */
    getLightState(lightId) {
        let self = this;
        return new Promise(function(resolve, reject){
            self.get("/lights/"+lightId)
                .then(result => {
                    if(result.error) {
                        reject(result.error);
                    }
                    else {
                        resolve(result);
                    }
                })
        });
    }

    /**
     *
     * @param sensorId
     * @returns {Promise<DeconzNativeSensor>}
     */
    getSensorState(sensorId) {
        let self = this;
        return new Promise(function(resolve, reject){
            self.get("/sensors/"+sensorId)
                .then(result => {
                    if(result.error) {
                        reject(result.error);
                    }
                    else {
                        resolve(result);
                    }
                })
        });
    }

    /**
     *
     * @param {string} lightId
     * @param {DeconzNativeLightStateUpdate} state
     * @returns {Promise<*>}
     */
    setLightState(lightId, state) {
        return this.put("/lights/"+lightId + "/state", state);
    }

    setLightOnOffState(lightId, state) {
        return this.put("/lights/"+lightId, state);
    }

    getGroupState(groupId) {
        let self = this;
        return new Promise(function(resolve, reject){
            self.get("/groups/"+groupId)
                .then(result => {
                    if(result.error) {
                        reject(result.error);
                    }
                    else {
                        resolve(result);
                    }
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    setGroupState(groupId, state) {
        return this.put("/groups/"+groupId  + "/action", state);
    }

    activateScene(groupId, sceneId){
        return this.put("/groups/" + groupId + "/scenes/"+sceneId + "/recall", {
            recall: {
                action: "active",
            }
        })
    }

    getConfiguration() {
        return new Promise((resolve, reject) => {
            this.get("/config")
                .then(result => {
                    if (result.error) {
                        reject(result.error);
                    } else {
                        resolve(result);
                    }
                })
                .catch(err => {
                    reject(err)
                })
        })
    }
}