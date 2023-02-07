import yaml from 'js-yaml';
import fs from 'fs';
import Service from "./Service.js";
import Intent from "./Intent.js";

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
        this.configLoaded = false;
    }

    initFunc({config}={}){
        let self = this;
        return new Promise(function(resolve, reject){
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
                console.log("IntentService started without loading a config file.")
                resolve();
            }
        })
    }

    loadConfig(path){
        let self = this;
        console.log("IntentService is loading config file...");
        return new Promise(function(resolve, reject){
            //read yaml file
            try {
                const doc = yaml.load(fs.readFileSync(appRoot + path, 'utf8'));
                self.parseDoc(doc)
                    .then(function(result){
                        console.log("IntentService config loaded successfully.");
                        self.configLoaded = true;
                        self.configPath = path;
                        resolve()
                    })
                    .catch(function(error){
                        console.error("Error: IntentService - Failed to load config: " + error);
                        reject();
                    })
            } catch (e) {
                console.log(e);
                reject(e);
            }
        })


    }

    async parseDoc(doc){
        //parse the json-style yaml config file to find all intents and variables
        let expressions = doc.context.expressions;
        let slots = doc.context.slots;
        let self = this;

        Object.keys(expressions).forEach(function(key,index) {
            // key: the name of the object key
            // index: the ordinal position of the key within the object
            let title = key;
            let lines = expressions[key];

            let intent = new Intent();
            intent.title = title;

            var intentGroups = {
                macros: [],
                macrosOptional: [],
                slots: [],
                slotsOptional: [],
            }

            lines.forEach(function(line, index){
                //lines contain 3 types of tokens, seperated by white-spaces, $ or @: words (no prefix), variables($-prefixed), aliases(@-prefixed)
                //we are only interested in @-prefixed tokens
                //remove ()
                // line = line.replace(/[\(\)]/g, "");
                // let tokens = line.split(/ |\w\$|\w@|\(\$|\(@/);
                let raw = line.slice();
                let tokens = line.matchAll(/(?<macros>(?<!\()@\w+)|(?<macrosOptional>(?<=\()@\w+)|(?<slots>(?<!\()\$\w+:\w+)|(?<slotsOptional>(?<=\()\$\w+:\w+)/g)
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

            self.addIntent(intent)
        })

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
        return true;
    }

    addIntent(intent){
        this.intents.push(intent)
    }

    /**
     * returns an intent
     * @param intentTitle
     * @returns {Intent}
     */
    getIntent(intentTitle) {
        return this.intents.find(intent => {
            return intent.title === intentTitle;
        })
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
}
export default new IntentService();

var line = function(index, raw, groups){
    this.index = index;
    this.raw = raw;
    this.groups = groups;
    return this;
}
