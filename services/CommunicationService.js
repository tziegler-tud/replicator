import db from '../schemes/mongo.js';
const DbClient = db.Client;
import ApiError from "../helpers/ApiError.js";
import TcpError from "../helpers/TcpError.js";
import tcpResponse from "../helpers/tcpResponseGenerator.js"
import { Server } from "socket.io";
import { networkInterfaces } from 'os';
import Service from "./Service.js";
import clientService from "./ClientService.js"
import Client from "../classes/Client.js";
import {instrument} from "@socket.io/admin-ui";

/**
 * @typedef VoiceCommandObject
 * @property isUnderstood {Boolean} true if the command was understood
 * @property intent {String} intend class descriptor
 * @property slots {Object} dynamic object containing the variables defined by the rhino model. Check model description for docs
 */

/**
 * @typedef CommandObject
 * @property {VoiceCommandObject} command
 * @property {String} clientId
 */

/**
 * @typedef {Socket} IOSocket
 * @property {Client} attachedClient
 */

/**
 * @class
 * @Singleton
 * CommunicationService class. Creates a tcp server and handles all incoming and outgoing tcp connections.
 */
class CommunicationService extends Service {
    constructor(){
        super();
        let self = this;
        this.tcpPort = 9000;
        this.httpPort = 3100;

        this._tcpAddress = "127.0.0.1"; //fallback
        this._httpAddress = "127.0.0.1"; //fallback;

        this.tcpServer = undefined;

        this.server = {
            serverId: "generateMe",
            url: undefined,
            endpoints: {
                tcp: {
                    address: this._tcpAddress,
                    port: this.tcpPort,
                },
                http: {
                    address: this._httpAddress,
                    port: this.httpPort,
                }
            }
        }

        return this;
    }

    initFunc(args) {
        let self = this;
        return new Promise(function(resolve, reject){
            console.log("Initializing CommunicationService...");
            //find available network interfaces
            self.networkAddresses = self.findNetworkInterfaces();
            //if an external address is available, use it. Otherwise, use internal
            if(self.networkAddresses.external.length > 0) {
                self.selectNetworkInterface(self.networkAddresses.external[0]);
                console.log("Using network interface: " + self.url)
            }
            else self.selectNetworkInterface(self.networkAddresses.internal[0]);

            //start socket.io server
            const io = new Server(self.server.endpoints.tcp.port, {
                cors: {
                    origin: ["https://admin.socket.io"],
                    // credentials: true
                }
            });

            instrument(io, {
                auth: false,
                mode: "development",
            });

            io.use(self.tcpClientAuthHandler);

            io.engine.on("connection_error", (err) => {
                console.log("Connection error:")
                console.log(err.req);      // the request object
                console.log(err.code);     // the error code, for example 1
                console.log(err.message);  // the error message, for example "Session ID unknown"
                console.log(err.context);  // some additional error context
            });

            io.on("connection", /** @param socket {IOSocket}*/ function(socket) {

                const client = socket.attachedClient;
                if(!client) {
                    //this should contain the client after authentication. Something went wrong
                    console.log("Connection error: Client not found. Closing connection.")
                    socket.close();
                    return;
                }
                console.log("Client connected: " + client.identifier);
                socket.on("processCommand", (data, callback) => {
                    self.processClientCommand(socket, data)
                        .then((result)=> {
                            console.log("Successfully processed command obtained from client");
                            data.result = {
                                success: true,
                                error: undefined,
                            }
                            self.tcpSend(socket, "commandSuccessful", data)
                            // callback("got it")
                        })
                        .catch(err => {
                            console.log("Failed to process client command: " + err);
                            data.result = {
                                success: false,
                                error: err,
                            }
                            self.tcpSend(socket, "commandFailed", data)
                            // callback("got it")
                        })
                });
                socket.on("message", (data) => self.tcpMessage(socket, data));
                socket.on("disconnect", (reason)=> {
                    console.log("Client disconnected: " + client.identifier);
                    clientService.disconnectClient(client)
                        .then(result => {
                            console.log("Client status set to disconnected: " + client.identifier);
                        })
                });
            });

            const registrationNamespace = io.of("/register");
            registrationNamespace.use((socket, next) => {
                // only triggered when the client tries to reach this custom namespace

                next();
            });
            registrationNamespace.on("connection", socket => {
                console.log("a client connected on registration endpoint.")
                socket.on("registerClient", function(data){
                    //check if client sent clientId
                    const clientId = data.clientId;
                    if(clientId) {
                        //client sent a clientId. Lets check if this id is already registered
                        let knownClient = clientService.findOneById(clientId); //try id
                        if (knownClient) {
                            //found the client. Let's ask to connect instead
                            let response = {
                                err: undefined,
                                response: tcpResponse.tpcResponse.REGISTRATION.ALREADYREGISTERED,
                                data: {},
                            }
                            socket.emit("registrationError", response);
                        }
                    }
                    else {
                        //no clientId sent, standard registration procedure from here
                        clientService.registerClient(data)
                            .then(result => {
                                //registration successful.
                                //attach server Identifier
                                result.serverId = self.server.serverId;
                                let response = {
                                    err: undefined,
                                    response: tcpResponse.tpcResponse.REGISTRATION.SUCCESSFULL,
                                    data: result,
                                }
                                socket.emit("registrationComplete", response);
                            })
                            .catch(err => {
                                //registration failed.
                                let response = {
                                    err: undefined,
                                    response: tcpResponse.tpcResponse.REGISTRATION.ALREADYREGISTERED,
                                    data: {},
                                }
                                socket.emit("registrationError", response);
                            })
                    }
                })
            })
            resolve();
        })
    }

    getHttpUrl() {
        return "http://"+this.server.endpoints.http.address + ":" + this.server.endpoints.http.port;
    }

    tcpMessage(socket, data){
        console.log(data);
        socket.emit("message", data);
    }

    tcpSend(socket, command, data) {
        socket.emit(command, data);
    }

    tcpSendWithResponse(socket, command, data) {
        return socket.emitWithAck(command, data);
    }

    tcpClientAuthHandler(socket, next){

        const clientId = socket.handshake.auth.clientId;
        //check if client sent clientId
        if(clientId){
            //client sent a clientId. Lets check if this id is already registered
            let knownClient = clientService.findOneById(clientId); //try id
            if(knownClient) {
                //found the client. Lets connect!
                clientService.connectClient(knownClient)
                    .then(result => {
                        //client connected successfully
                        //attach socket to client
                        result.client.setSocket(socket);
                        /**
                         * @type {Client}
                         */
                        socket.attachedClient = result.client;
                        socket.clientId = clientId;
                        next();
                    })
                    .catch(err => {
                        //failed to connect client.
                        next(err);
                    })
            }
            else {
                //client sent an id, but is not known. This might happen if we removed the client on the server.
                //if we did, we dont want the client to connect itself. Instead, we ask the client to re-register and get a new clientId.
                //we call this registration expired
                let err = new TcpError(tcpResponse.tpcResponse.REGISTRATION.EXPIRED)
                next(err);
            }
        }
        else {
            //client did not send a clientId. We assume it is not registered.
            //we ask the client to register first.
            let err = new TcpError(tcpResponse.tpcResponse.REGISTRATION.NOTREGISTERED)
            next(err)
        }
    }

    /**
     *
     * @param socket {IOSocket}
     * @param commandData {CommandObject}
     * @returns {Promise<unknown>}
     */
    processClientCommand(socket, commandData){
        console.log("processing client command:");
        const commandClientId = commandData.clientId;

        return new Promise(function(resolve, reject){
            if(!socket.attachedClient.clientId === commandClientId) {
                //missmatch. Something is wrong
                let err = new TcpError(tcpResponse.tpcResponse.ARGUMENTS.INVALIDCLIENTID);
                socket.emit("error", err);
            }

            /**
             * @type {Client|*}
             */
            const client = socket.attachedClient;
            //we don't want to expose the socket to the client, in order to separate responsibilities.
            // Instead, we forward an emitter object, which acts as an adapter to the socket.
            //create new Emitter and forward to client
            const emitter = new Emitter(socket);
            client.processCommand(commandData, emitter)
                .then(result => {
                    resolve();
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    findNetworkInterfaces(){
        const nets = networkInterfaces();
        let results = {
            internal: [],
            external: []
        }
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
                const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
                if (net.family === familyV4Value) {
                    if(net.internal) results.internal.push({name: name, address: net.address, internal: true});
                    else results.external.push({name: name, address: net.address, external: true});
                }
            }
        }
        //choose first entry
        return results;
    }

    selectNetworkInterface(entry, protocol="http://"){
        if(!entry.address){
            if(typeof entry === "string") entry = {address: entry}
        }
        this.server.url = protocol + entry.address;
        this.server.endpoints.tcp.address = entry.address;
        this.server.endpoints.http.address = entry.address;
        return this.server;
    }

    discoverClient({url, tcpAddress=this.server.endpoints.tcp.address, tcpPort=this.server.endpoints.tcp.port, httpAddress=this.server.endpoints.http.address, httpPort=this.server.endpoints.http.port}={}){
        let self = this;
        const clientUrl = url;
        const endpoints = {
            tcp: {
                address: tcpAddress,
                port: tcpPort,
            },
            http: {
                address: httpAddress,
                port: httpPort,
            }
        }
        let clientServerObject = this.server;
        clientServerObject.endpoints = Object.assign(clientServerObject.endpoints, endpoints);

        //try to find a new client at the given url
        return new Promise(function(resolve, reject){
            //create a dummy client obj
            let tmp = new Client({identifier: "discovery-tmp-client", url: clientUrl, server: clientServerObject});
            tmp.requestAuthentication()
                .then(result => {
                    //successful, check for details of what happened
                    resolve(result);
                })
                .catch(reason => {
                    const message = "Client failed to connect."
                    reject(message);
                })
        })

    }
}

class Emitter {
    constructor(socket){
        this.socket = socket;
    }

    emit(event, data, cb){
        this.socket.emit(event, data, function(response){
            cb(response)
        })
    }

    events = {
        ERROR: "error",
        STATE: "state",
        COMPLETE: "complete",
    }
}

export default new CommunicationService();