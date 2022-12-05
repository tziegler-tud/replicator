import fetch from 'node-fetch';
import db from '../schemes/mongo.js';
const DbClient = db.Client;

export default class Client {
    /**
     * creates a new client
     * @param clientInformation
     */
    constructor(clientInformation) {
        this.dbId = undefined;
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
        this.lastConnection = undefined;
    }

    /**
     * parses the client to the format used by the db
     * @returns {*|{skills, identifier, settings: (*|{active: boolean, muted: boolean}), versionData, url: *, lastConnection}}
     */
    parseToDb(){
        this.dbObject = {
            identifier: this.identifier,
            url: this.url,
            versionData: this.versionData,
            settings: this.settings,
            skills: this.skills,
            lastConnection: this.lastConnection,
        }
        return this.dbObject;
    }

    /**
     *
     * retrieves the object stored in the db
     * @returns {Promise<dbClient>}
     */
    getDbObject(){
        return dbClient.find({identifier: this.identifier});
    }

    /**
     * saves the client to the db
     *
     * @returns {Promise<Client|Error>}
     */
    saveToDb(){
        const dbObject = this.parseToDb();
        let dbClient = new DbClient(dbObject);
        return new Promise((resolve, reject)=> {
            dbClient.save()
                .then(dbCient => {
                    this.dbId = dbClient.id;
                    resolve(this);
                })
                .catch(err => {
                    reject(err)
                })
        });
    }

    test(){
        //test the connection
        const testUrl = this.url + "/test"
        return new Promise((resolve, reject)=> {
            fetch(testUrl)
                .then(response => {
                    if(response.ok) {
                        console.log("Test successfull: " + this.identifier + " at " + this.url)
                        resolve(true);
                    }
                    else reject(response);
                })
        })
    }
    getStatus(){
        const url = this.url + "/mute";
        return new Promise((resolve, reject)=> {
            const options = {
                method: "GET",
            }
            fetch(url, options)
                .then(response => {
                    if(response.ok) {
                        const data = response.json();
                        resolve(data);
                    }
                    else reject(response);
                })
        })
    }
    send({path="/", data={}, options={}}){
        const url = this.url + path;
        return fetch(url, options)
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
                        console.log("Test successfull: " + this.identifier + " at " + this.url)
                        resolve(true);
                    }
                    else reject(response);
                })
        })
    }
    playSound(){
        //spacer
    }
}

// module.exports = Client;