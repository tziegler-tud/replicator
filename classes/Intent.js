import db from '../schemes/mongo.js';
const dbIntent = db.Intent;

/**
 * Intent
 * @class
 */
export default class Intent {
    /**
     *
     * @param args
     */
    constructor(args){
        if(args === undefined) args = {};
        this._identifier = args.identifier ? args.identifier : "";
        this._variables = args.variables? args.variables : {};
        this._lines = args.lines? args.lines : [];
        this._handlers = [];
        this._groups = {
            macros: [],
            macrosOptional: [],
            slots: [],
            slotsOptional: [],
        };
        this._groups = Object.assign(this._groups, args.groups)
        this.dbObject = undefined;

        if(args._id) {
            //constructor called with database element.
            this.dbObject = args;
        }
    }

    saveToDb(){
        //check if dbObject exists
        if(this.dbObject){
            this.dbObject = Object.assign(this.dbObject, this.parseToDb());
        }
        else {
            this.dbObject = new dbIntent(this.parseToDb());
        }
        return this.dbObject.save();
    }

    parseToDb(){
        return {
            identifier: this.identifier,
            variables: this.variables,
            lines: this.lines,
            handlers: this.handlers,
            groups: this.groups,
        }
    }

    get title (){
        return this._identifier;
    }
    get identifier(){
        return this._identifier;
    }

    get variables(){
        return this._variables;
    }

    get handlers(){
        return this._handlers;
    }

    get lines() {
        return this._lines;
    }

    get groups() {
        return this._groups;
    }

    set title(title){
        this._identifier = title;
    }

    set identifier(identifier){
        this._identifier = identifier;
    }

    set variables(variables) {
        this._variables = variables;
    }

    addLine(line){
        this._lines.push(line);
        let self = this;
        //update intent variable groups
        Object.keys(line.groups).forEach(function(key, index, array){
            //check if key is in groups
            if(self._groups[key]!==undefined) {
                //found key, add values if not present
                line.groups[key].forEach(function(token){
                    if(!self._groups[key].includes(token)) self._groups[key].push(token);
                })
            }
        })
        //update variables
        this.updateVariables();
    }

    updateVariables(){
        let self = this;
        //find slots and optional slots in groups
        let slots = this._groups.slots;
        let slotsOptional = this._groups.slotsOptional;
        [slots, slotsOptional].forEach(function(iterator){
            iterator.forEach(function(slot){
                //extract typeIdentifier and variable name
                slot = slot.replace(/\$/, "");
                let tokens = slot.split(":");
                let type = tokens[0];
                let name = tokens[1];
                if(self._variables[name] === undefined) {
                    self._variables[name] = type;
                }
            })
        })
    }

    addHandler(handler){
        this._handlers.push(handler);
    }

    addHandlerArray(handlerArray){
        handlerArray.forEach(handler =>{
            this._handlers.push(handler)
        });
    }
}
