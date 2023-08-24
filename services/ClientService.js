import db from '../schemes/mongo.js';
const DbClient = db.Client;
//
import Client from "../classes/Client.js";
import Service from "./Service.js";
import CommunicationService from "./CommunicationService.js"
import voiceCommandService from "./voiceCommandService.js"

import ApiError from "../helpers/ApiError.js";
import tcpResponse from "../helpers/tcpResponseGenerator.js"
import communicationService from "./CommunicationService.js";

//Handles client registration and data processing
//Singleton


class ClientService extends Service{

    static STATUS = {
        CONNECTED: "connected",
        DISCONNECTED: "disconnected",
    }
    constructor(init=false){
        super();
        let self = this;

        /**
         *
         * @type {Client[]}
         */
        this.clients = [];
        return this;
    }

    initFunc(args) {
        let self = this;
        return new Promise(function(resolve, reject){
            console.log("Initializing ClientService...");
            let loader = self.loadKnownClients();
            loader.then(result => {
                resolve();
            })
        })
    }

    getClientStatus() {
        let self = this;
        return new Promise(function(resolve, reject){
            const total = self.clients.length;
            const connected = self.clients.filter(client => client.connection.connected);
            self.getAllClientsJSON()
                .then(clients => {
                    const response = {
                        stats: {
                            total: total,
                            connected: connected.length
                        },
                        clients: clients,
                    }
                    resolve(response)
                })
        })
    }

    getAllClients() {
        let self = this;
        return new Promise(function(resolve, reject){
            //return all clients
            resolve(self.clients)
        })
    }

    getAllClientsJSON() {
        let self = this;
        return new Promise(function(resolve, reject){
            //return all clients json
            let jsonArray = []
            self.clients.forEach(client => jsonArray.push(client.getJSON()))
            resolve(jsonArray);
        })
    }


    /**
     *
     * @param id {ObjectId | String}
     * @returns {Promise<Client>}
     */
    async getById(id){
        const client = this.findOneById(id);
        if(!client) throw new Error("Client not found.");
        return client;
    }

    getByIdSync(id){
        return this.findOneById(id);
    }

    /**
     *
     * @param identifier {String}
     * @returns {Promise<Client>}
     */
    async getByIdentifier(identifier){
        const client = this.findOneByIdentifier(identifier);
        if(!client) throw new Error("Client not found.");
        return client;
    }

    getByIdentifierSync(identifier){
        return this.findOneByIdentifier(identifier);
    }

    /**
     *
     * @param id
     * @returns {Client}
     */
    async getDbClientById(id){
        return DbClient.findById(id)
    }

    /**
     *
     * @param identifier
     * @returns {}
     */
    getDbClientByIdentifier(identifier){
        return DbClient.find({identifier: identifier})
    }

    registerClient(clientInformation={}){
        //add a new client
        let self = this;

        const identifier = clientInformation.identifier;
        const url = clientInformation.url ? clientInformation.url : clientInformation.requestUrl;
        const versionData = clientInformation.version;

        const defaultSettings = {
            active: true,
            muted: false,
        }
        clientInformation.settings = clientInformation.settings ? clientInformation.settings : {};
        let settings = Object.assign(defaultSettings, clientInformation.settings);
        const skills = clientInformation.skills;

        let clientParams = {
            identifier: identifier,
            url: url,
            versionData: versionData,
            settings: settings,
            skills: skills,
        }
        let client = new Client(clientParams);

        return new Promise((resolve,reject) => {
            client.saveToDb()
                .then(client => {
                    //client saved successfully. Add to runtime
                    self.clients.push(client);
                    const response = {
                        clientId: client.clientId,
                        client: client,
                    }
                    resolve(response);
                })
                .catch(err => {
                    reject(err)
                })
        })
    }

    connectClient(clientInformation){
        //connect a client that is already known
        let self = this;

        const identifier = clientInformation.identifier;
        const clientId = clientInformation.clientId;
        const url = clientInformation.url ? clientInformation.url : clientInformation.requestUrl;
        const versionData = clientInformation.versionData;
        const skills = clientInformation.skills;

        return new Promise((resolve,reject) => {
            //check known clients for identifier
            let client = self.findOneById(clientId); //try id
            if(client) {
                clientInformation.settings = clientInformation.settings ? clientInformation.settings : {};
                client.settings = Object.assign(client.settings, clientInformation.settings);
                client.setConnected(); //mark as connected
                const response = {
                    clientId: client.clientId,
                    status: ClientService.STATUS.CONNECTED,
                    client: client,
                }
                resolve(response);
            }
            else {
                //client not found.
                const reason = new ApiError("Client not known.", 401, "UnauthorizedError");
                reject(reason)
            }
        })
    }

    disconnectClient(clientInformation) {
        //disconnect a client that is already known
        let self = this;

        const identifier = clientInformation.identifier;
        const clientId = clientInformation.clientId;
        const url = clientInformation.url ? clientInformation.url : clientInformation.requestUrl;
        const versionData = clientInformation.versionData;
        const skills = clientInformation.skills;

        return new Promise((resolve,reject) => {
            //check known clients for identifier
            let client = self.findOneById(clientId); //try id
            if(client) {
                client.setDisconnected(); //mark as connected
                const response = {
                    clientId: client.clientId,
                    status: ClientService.STATUS.DISCONNECTED,
                    client: client,
                }
                resolve(response);
            }
            else {
                //client not found.
                const reason = new ApiError("Client not known.", 401, "UnauthorizedError");
                reject(reason)
            }
        })
    }

    /**
     *
     * @param id {ObjectId} client database id
     * @param force {Boolean} allow deletion if no matching runtime object was found
     */
    removeClient(id, force=false){
        let self = this;
        return new Promise(function(resolve, reject){
            //find client in runtime object
            let rtClientIndex = self.clients.findIndex(client=>client.clientId.toString() === id.toString());
            if(rtClientIndex > -1){
                //remove from rt clients
                self.clients.splice(rtClientIndex, 1);
                //remove from db
                DbClient.findByIdAndDelete(id)
                    .then(result => {
                        resolve(result)
                    })
                    .catch(err => {
                        reject(err)
                    })
            }
            else {
                //runtime client not found. Trying Database lookup to see if its there
                DbClient.findById(id)
                    .then(result => {
                        //client found in Db, but not in rt object. This is strange, and most likely unwanted. Only remove if force option is set
                        if(force){
                            DbClient.findByIdAndDelete(id)
                                .then(result => {
                                    resolve(result)
                                })
                                .catch(err => {
                                    reject(err)
                                })
                        }
                    })
                    .catch(err => {
                        reject(err);
                    })
            }
        })
    }

    loadKnownClients(){
        let self = this;
        return new Promise(function(resolve, reject){
            //retrieve clients from db
            DbClient.find()
                .then(dbClients => {
                    console.log("found "+ dbClients.length + " known clients in database.")
                    let clientTests = [];
                    dbClients.forEach((dbClient)=> {
                        clientTests.push(self.loadClientFromDb(dbClient).catch(function(clientTestResult){
                            //client.test() failed, for whatever reason. Add the client anyway, but set state to error
                            clientTestResult.client.error = clientTestResult.error;
                            return clientTestResult;
                        }));
                    })
                    Promise.all(clientTests)
                        .then(function(clientTestResults){
                            //add clients to runtime client list
                            let clientsToAdd = clientTestResults.map(result => {return result.client})
                            self.clients = self.clients.concat(clientsToAdd);
                            resolve();
                        })
                        .catch(err => {
                            throw new Error(err);
                        })
                })
        })
    }

    loadClientFromDb(dbClient){
        let self = this;
        return new Promise(function(resolve, reject){
            let client = new Client(dbClient, dbClient._id);
            //test connection
            client.test()
                .then(result=> {
                    let state = result ? ClientService.STATUS.CONNECTED : ClientService.STATUS.DISCONNECTED;
                    //result holds the test result. Note that Client.test() resolves regardless of the client connection status.
                    resolve({state: state, client: client, error: undefined})
                })
                .catch(err => {
                    //request failed with error
                    //most likely a problem with node fetch. Check Client.test() function code for errors.
                    reject({state: ClientService.STATUS.ERROR, client: client, error: err})
                })
        })
    }

    saveClientsToDb(){
        let savePromises = []
        this.clients.forEach((client)=>{
            savePromises.push(client.saveToDb());
        })
        Promise.all(savePromises)
            .then(result => {
                console.log(this.clients.length + " clients saved to db.");
            })
            .catch(err => {
                console.error("Failed to save clients to db.");
            })
    }

    /**
     *
     * @param identifier {String}
     * @returns {Client}
     */
    findOneByIdentifier(identifier) {
        return this.clients.find(client => client.identifier.toString() === identifier.toString())
    }

    /**
     *
     * @param id {String}
     * @returns {Client}
     */
    findOneById(id) {
        return this.clients.find(function(client){
            return client.clientId.toString() === id.toString()
        })
    }

    processClientCommand(client, commandData, emitter){
        return new Promise(function(resolve, reject){
            console.log("processing client command:");
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
            //retrieve client
            if(!client){
                //no client connected, connections seems corrupted.
                //send connection fail and kill channel
                let response = {
                    err: undefined,
                    response: tcpResponse.tpcResponse.CONNECTION.FAIL,
                    data: {},
                }
                reject(response);
            }

            if(!client.clientId === commandClientId) {
                //missmatch. Something is wrong
                let response = {
                    err: undefined,
                    response: tcpResponse.tpcResponse.ARGUMENTS.INVALIDCLIENTID,
                    data: {},
                }
                reject(response);
            }
            else {
                //client found.
                //forward to voiceCommandService
                client.processCommand(command, emitter);
            }
        })
    }

    discoverClient(data) {
        return communicationService.discoverClient(data);
    }

}

export default new ClientService();
