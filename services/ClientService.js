import db from '../schemes/mongo.js';
const dbClient = db.Client;
//
import Client from "./Client.js";

//Handles client registration and data processing
//Singleton


export default class ClientService {
    constructor(){
        this.clients = [];
        ClientService.setInstance(this);
        return this;
    }
    static _instance;

    static getInstance() {
        if (this._instance) {
            return this._instance;
        }
        else {
            return this.createInstance();
        }
    }
    static createInstance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new ClientService();
        return this._instance;
    }

    static setInstance(instance) {
        this._instance = instance;
        return this._instance;
    }

    registerClient(clientInformation={}){
        //add a new client
        const identifier = clientInformation.identifier;
        const url = clientInformation.url;
        const versionData = clientInformation.versionData;

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
                .then(result => {
                    resolve(client);
                })
                .catch(err => {
                    reject(err);
                })
        })
    }

    loadKnownClients(){
        //retrieve clients from db
        dbClient.find()
            .then(clients => {
                console.log("found "+ clients.length + " known clients in database.")
                clients.forEach((client)=> {
                    this.loadClientFromDb(client);
                })
            })
    }
    loadClientFromDb(dbClient){
        let client = new Client(dbClient);
        //test connection
        client.test()
            .then(result=> {
                this.clients.push(client)
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
}

// module.exports = ClientService;