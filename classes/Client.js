import fetch from 'node-fetch';
import db from '../schemes/mongo.js';
import tcpResponse from "../helpers/tcpResponseGenerator.js";
import voiceCommandService from "../services/voiceCommandService.js";
import LocationManager from "../managers/LocationManager.js"
import {transformDateTimeString} from "../helpers/utility.js";
const DbClient = db.Client;

/**
 * @class
 * Client class.
 */
export default class Client {
    /**
     * creates a new client
     * @param clientInformation
     * @param dbId {String} database id. Indicates that a db object exists.
     */
    constructor(clientInformation, dbId = undefined) {
        this.dbId = dbId ? dbId.toString() : undefined;
        this.clientId = clientInformation.clientId;
        this.server = clientInformation.server;
        this.identifier = clientInformation.identifier;
        this.url = clientInformation.url;
        this.versionData = clientInformation.versionData;
        this.defaultSettings = {
            active: true,
            muted: false,
        }
        clientInformation.settings = clientInformation.settings ? clientInformation.settings : {};
        this.settings = Object.assign(this.defaultSettings, clientInformation.settings);
        this.skills = clientInformation.skills;
        this.locations = clientInformation.locations;
        this.lastConnection = clientInformation.lastConnection;
        this.state = {};
        this.connection = {
            connected: false,
            url: this.url,
            socket: undefined,
        }
    }

    getClientDetails(){
        return {
            information: {
                identifier: {
                    type: "text",
                    label: "Identifier",
                    value: this.identifier
                },
                clientId: {
                    type: "text",
                    label: "database ID",
                    value: this.clientId,
                },
                versionData: {
                    type: "text",
                    label: "version",
                    value: this.versionData,
                }
            },
            connection: {
                connected: {
                    type: "Boolean",
                    label: "connected",
                    value: this.connection.connected,
                },
                url: {
                    type: "text",
                    label: "url",
                    value: this.connection.url,
                },
                lastConnection: {
                    type: "Date",
                    label: "last connection",
                    value: transformDateTimeString(this.lastConnection).dateTime,
                },
            },
            state: {

            },
            skills: this.skills,
            settings: this.settings,

        }
    }

    getJSON(){
        return {
            dbId: this.dbId,
            clientId: this.clientId,
            server: this.server,
            identifier: this.identifier,
            versionData: this.versionData,
            settings: this.settings,
            skills: this.skills,
            locations: this.locations,
            lastConnection: this.lastConnection,
            state: this.state,
            connection: {
                connected: this.connection.connected,
                url: this.connection.url,
            }
        }
    }

    /**
     * parses the client to the format used by the db
     * @returns {*|{skills, identifier, settings: (*|{active: boolean, muted: boolean}), versionData, url: *, lastConnection}}
     */
    parseToDb(){
        let dbObject = {
            identifier: this.identifier,
            url: this.url,
            versionData: this.versionData,
            settings: this.settings,
            skills: this.skills,
            locations: this.locations,
            lastConnection: this.lastConnection,
        }
        return dbObject;
    }

    /**
     *
     * retrieves the object stored in the db
     * @returns {Promise<DbClient>}
     */
    getDbObject(){
        return DbClient.find({identifier: this.identifier});
    }

    /**
     *
     * retrieves the object stored in the db
     * @returns {Promise<DbClient>}
     */
    getDbObjectById(){
        return DbClient.findById(this.dbId);
    }

    /**
     * saves the client to the db
     *
     * @returns {Promise<Client|Error>}
     */
    saveToDb(){
        let self = this;
        const dbObject = this.parseToDb();

        return new Promise((resolve, reject)=> {
            if(self.dbId) {
                //dbId given. Try to get db Object from database
                self.getDbObjectById()
                    .then(dbClient => {
                        let updatedClient = Object.assign(dbClient, dbObject);
                        updatedClient.save()
                            .then(dbClient => {
                                self.clientId = dbClient.clientId;
                                resolve(self);
                            })
                            .catch(err => {
                                reject(err)
                            })
                    })
                    .catch(err => {
                        //db id was given, but client was not found.
                        reject(err);
                    })
            }
            else {
                let dbClient = new DbClient(dbObject);
                dbClient.clientId = dbClient.id;
                dbClient.save()
                    .then(dbClient => {
                        self.clientId = dbClient.clientId;
                        resolve(self);
                    })
                    .catch(err => {
                        reject(err)
                    })
            }
        });
    }

    test(){
        let self = this;
        //test the connection
        const testUrl = this.url + "/hello"
        return new Promise((resolve, reject)=> {
            fetch(testUrl)
                .then(response => {
                    if(response.ok) {
                        console.log("Client connection test successful: " + this.identifier + " at " + this.url);
                        self.connection.connected = true;
                        self.lastConnection = Date.now();
                        resolve(true);
                    }
                    else {
                        //client did not respond.
                        console.log("Client connection test not successful: " + this.identifier + " at " + this.url);
                        self.connection.connected = false;
                        resolve(false)
                    }
                })
                .catch(err => {
                  reject(err);
                })
        })
    }

    /**
     * calls the client api on the requestAuthentication endpoint. Sends serverId and endpoints
     * @returns {Promise<unknown>}
     */
    requestAuthentication(){
        let self = this;
        //ask client to connect
        let path = "/api/v1/requestAuthentication";
        let data = {
            serverId: this.server.serverId,
            url: this.server.url,
            endpoints: this.server.endpoints,
        }
        return new Promise(function(resolve, reject){
            self.send({path: path, method: "POST", data: data})
                .then(response => {
                    if(response.ok){
                        response.json()
                            .then(data => {
                                resolve(data);

                            })
                    }
                    else {
                        reject(response);
                    }
                })
                .catch(err => reject(err))
        });
    }

    /**
     *
     * @param commandData {CommandObject}
     * @param emitter
     * @returns {Promise<unknown>}
     */
    processCommand(commandData, emitter){
        const self = this;
        return new Promise(function(resolve, reject){
            console.log("processing client command.");
            const command = commandData.command;
            const commandClientId = commandData.clientId;
            if(!command) {
                let response = {
                    err: undefined,
                    response: tcpResponse.tpcResponse.ARGUMENTS.MISSING,
                    data: {},
                }
                reject(response);
            }
            else {
                //client found.
                //forward to voiceCommandService
                voiceCommandService.processClientCommand(self, commandData.command, emitter, {});
            }
        })
    }

    getStatus(){
        let self = this;
        const url = this.url + "/state";
        return new Promise((resolve, reject)=> {
            const options = {
                method: "GET",
            }
            fetch(url, options)
                .then(response => {
                    if(response.ok) {
                        const data = response.json()
                            .then(data => {
                                self.state = data;
                                resolve(data);
                            })
                    }
                    else reject(response);
                })
        })
    }

    getSkills(){
        let self = this;
        const url = this.url + "/skills";
        return new Promise((resolve, reject)=> {
            const options = {
                method: "GET",
            }
            fetch(url, options)
                .then(response => {
                    if(response.ok) {
                        const data = response.json();
                        self.skills = data;
                        resolve(data);
                    }
                    else reject(response);
                })
        })
    }

    /**
     *
     * @param path
     * @param method
     * @param data
     * @param options
     * @returns {Promise<Response>}
     */
    send({path="/", method="GET", data={}, options={}}){
        const url = "http://" + this.url + path;
        let fetchOptions = options;
        fetchOptions.method = method;
        fetchOptions.body = JSON.stringify(data);
        fetchOptions.headers= {"Content-Type": "application/json"}
        return fetch(url, fetchOptions)
    }

    setState(state){
        const url = this.url + "/state";
        return new Promise((resolve, reject)=> {
            const options = {
                method: "POST",
                body: state,
            }
            fetch(url, options)
                .then(response => {
                    if(response.ok) {
                        console.log("State update successful: " + this.identifier + " at " + this.url)
                        resolve(true);
                    }
                    else reject(response);
                })
        })
    }
    mute(){
        const url = this.url + "/mute";
        return new Promise((resolve, reject)=> {
            const options = {
                method: "POST",
                body: {},

            }
            fetch(url, options)
                .then(response => {
                    if(response.ok) {
                        console.log("Client muted: " + this.identifier + " at " + this.url)
                        resolve(true);
                    }
                    else reject(response);
                })
        })
    }
    playSound(){
        //spacer
    }

    setConnected(){
        this.lastConnection = Date.now();
        this.connection.connected = true;
        this.saveToDb();
    }

    setSocket(socket){
        this.connection.socket = socket;
    }

    setDisconnected(){
        this.connection.connected = false;
    }

    addLocation(locationId){
        let self = this;
        return new Promise(function(resolve, reject){
            //get location
            LocationManager.getById(locationId)
                .then(location => {
                    if(location){
                        self.locations.push(location);
                        self.saveToDb()
                            .then(result => {
                                resolve(result);
                            })
                            .catch(err => reject(err))
                    }
                    else {
                        reject("Location not found.")
                    }
                })
        })
    }
    removeLocation(locationId){
        let self = this;
        return new Promise(function(resolve, reject){
            //get location
            let i = self.locations.findIndex(location => location.id === locationId)
            if (i > -1)  {
                self.locations.splice(i, 1);
                self.saveToDb()
                    .then(result => {
                        resolve(result);
                    })
                    .catch(err => reject(err))
            }
            else {
                reject("Location " + locationId + " not assigned to client.")
            }

        })
    }
}

// module.exports = Client;