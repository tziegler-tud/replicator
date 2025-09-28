import yaml from 'js-yaml';
import fs from 'fs';
import Service from "./Service.js";
import Intent from "../classes/Intent.js";
import SettingsService from "./SettingsService.js";
import db from '../schemes/mongo.js';
const dbIntent = db.IntentModel;

/**
 * @typedef SlotObject {Object}
 * @property {String} title
 * @property {String[]} values
 */

class IntentService extends Service{
    constructor(){
        super();
        /**
         * @type {Intent[]}
         */
        this.intents = [];
        /**
         * @type {SlotObject[]}
         */
        this.slots = [];
        this.macros = [];
        this.configLoaded = false;
        this.serviceName = "IntentService";
    }

    initFunc({config}={}){
        let self = this;
        return new Promise(function(resolve, reject){
            //check if a setting is present in the db
            // if(self.globalSettings.intentConfig.active){
            //     self.debug("Using stored intents.");
            //     self.loadDatabase()
            //         .then(result => {
            //             resolve();
            //
            //         })
            //         .catch(err => {
            //             self.debug("Failed to load database content: " + err);
            //         })
            // }
            if(config) {
                self.loadConfig(config)
                    .then(result=> {
                        resolve();
                    })
                    .catch(err => {
                        reject(err);
                    })

            }
            else {
                self.debug("IntentService started without intents. Did you forget to load a config?")
                resolve();
            }
        })
    }

    loadConfig(path){
        this.debug("IntentService is loading config file...");
        return new Promise((resolve, reject) => {
            //read yaml file
            try {
                const doc = yaml.load(fs.readFileSync(path, 'utf8'));
                this.parseDoc(doc)
                    .then((result)=> {
                        this.debug("IntentService config loaded successfully.");
                        this.configLoaded = true;
                        this.configPath = path;
                        resolve()
                    })
                    .catch((error) =>{
                        this.debug("Error: IntentService - Failed to load config: " + error);
                        reject();
                    })
            } catch (e) {
                this.debug("Error: " + e);
                reject(e);
            }
        })


    }

    async parseDoc(doc){
        //parse the json-style yaml config file to find all intents and variables
        let expressions = doc.context.expressions;
        let slots = doc.context.slots;
        let macros = doc.context.macros;
        let self = this;

        for (const key in expressions) {
        // Object.keys(expressions).forEach(function(key,index) {
            // key: the name of the object key
            // index: the ordinal position of the key within the object
            let identifier = key;
            let lines = expressions[key];

            let intent = new Intent({identifier: identifier});
            intent.identifier = identifier;

            let identifiersLoaded = 0;

            lines.forEach(function(line, index){
                //lines contain 3 types of tokens, seperated by white-spaces, $ or @: words (no prefix), variables($-prefixed), aliases(@-prefixed)
                //we are only interested in @-prefixed tokens
                //remove ()
                // line = line.replace(/[\(\)]/g, "");
                // let tokens = line.split(/ |\w\$|\w@|\(\$|\(@/);
                let raw = line.slice();
                let tokens = line.matchAll(/(?<macros>(?<!\()@\w+)|(?<macrosOptional>(?<=\()@\w+)|(?<slots>(?<!\()\$\w+\.?\w*:\w+)|(?<slotsOptional>(?<=\()\$\w+:\w+)/g)
                var groups = {
                    macros: [],
                    macrosOptional: [],
                    slots: [],
                    slotsOptional: [],
                }
                for (const match of tokens){
                    Object.keys(match.groups).forEach(function(key){
                        let currentGroup = match.groups[key];
                        if(currentGroup !== undefined) {
                            groups[key].push(currentGroup);
                        }
                    })
                }
                let intentLine = {
                    index: index,
                    raw: raw,
                    groups: groups,
                }
                intent.addLine(intentLine)
            })
            // //check if already registered
            // let dbObject = await dbIntent.findOne({identifier: intent.identifier});
            // if (dbObject){
            //     //identifier already taken. Skip and load from db instead
            //     self.debug("Failed to load intent from config: Identifier already in database!");
            //     intent = new Intent(dbObject);
            // }
            try {
                // const result = await intent.saveToDb();
                self.addIntent(intent);
                identifiersLoaded++;
            }
            catch (e){
                self.debug("Skipping Element: " + intent.identifier + ". Reason: " + e);
            }
        }

        //parse slots
        Object.keys(slots).forEach(function(key,index) {
            // key: the name of the object key
            // index: the ordinal position of the key within the object
            let title = key;
            let values = slots[key];
            self.slots.push({
                title: title,
                values: values,
            })
        })

        //parse makros
        Object.keys(macros).forEach(function(key,index) {
            // key: the name of the object key
            // index: the ordinal position of the key within the object
            let title = key;
            let values = macros[key];
            self.macros.push({
                title: title,
                values: values,
            })
        })
        self.debug()
        return true;
    }

    loadDatabase(){
        let self = this;
        return new Promise(function(resolve, reject){
            dbIntent.find()
                .then(results => {
                    results.forEach(dbObject => {
                        let intent = new Intent(dbObject);
                        self.addIntent(intent);
                    })
                    resolve();
                });
        })
    }

    addIntent(intent){
        this.intents.push(intent)
    }

    /**
     * returns an intent
     * @param identifier {String} unique Intent identifier
     * @returns {Intent}
     */
    getIntent(identifier) {
        return this.intents.find(intent => {
            return intent.identifier === identifier;
        })
    }

    getIntentPromise(identifier){
        let self = this;
        return new Promise(function(resolve, reject){
            const intent = self.getIntent(identifier);
            if(intent){
                resolve(intent);
            }
            else {
                reject("Intent not found.")
            }
        })
    }

    getAllIntents(){
        return this.intents;
    }

    /**
     * returns all possible variable assignments for the slot matching the title
     * @param title {String} the title of the slot
     * @returns {SlotObject}
     */
    getSlot(title) {
        return this.slots.find(slot => {
            return slot.title === title;
        })
    }

    getAllSlots(){
        return this.slots;
    }

    getAllMacros(){
        return this.macros;
    }
}
export default new IntentService();

var line = function(index, raw, groups){
    this.index = index;
    this.raw = raw;
    this.groups = groups;
    return this;
}
