import http from "http";
import https from "https";

/**
 * @class
 * @abstract
 * Abstract Integration class.
 * Implementations of this class should expose a singleton instance to the app, useable by imports.
 * Module export of such a class should be a new instance.
 */
export default class Integration {
    constructor(){
        let self = this;
        this.initStarted = false;
        this.uniqueName = "abstract";
        this.readableName = "AbstractIntegration";
        this.status = this.statusEnum.NOTLOADED;
        this.integration = {
            type: "Abstract",
            data: {},
        }

        this.lights = [];
        this.grouped_lights = [];
        this.scenes = [];
    }

    /**
     * start the service
     * @param args {Object} Arguments object forwarded to the initialization function.
     */
    load(args){
        let self = this;
        this.initStarted = true;
        return new Promise(function(resolve, reject){
            self.initFunc(args)
                .then(result => {
                    self.status = self.statusEnum.LOADED;
                    resolve();
                })
                .catch(err => {
                    self.status = self.statusEnum.NOTLOADED;
                    reject("Integration failed to load.");
                });
        });
    }

    async initFunc(){
        //implemented by child classes
        return true;
    }

    async reload(args={}){
        console.log("Reloading integration: " + this.uniqueName);
        this.status = this.statusEnum.NOTLOADED;
        return this.load(args);
    }

    getIntegration(data) {
        const i = {
            data: data,
        }
        return Object.assign(this.integration, i);
    }


    statusEnum = {
        NOTLOADED: 0,
        LOADED: 1
    }
}



export function httpsGet(url){
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


export function httpGet(url){
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

export function httpRequest(url, options, data){
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

export function httpsRequest(url, options, data){
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