import Component from "./Component.js"
import "../../scss/components/interactiveList.scss";
import Handlebars from "handlebars";
import {MDCSwitch} from '@material/switch';
import {MDCList} from "@material/list";

export default class InteractiveList extends Component{
    constructor({element, config={}}={}, data={listEntries: [], interactions: []}) {
        super({name: "interactiveList", element: element, config: config, data: data});
        let defaultLabelFunc = function(entry){
            return entry.toString();
        }
        this.config.entryLabel = this.config.entryLabel ? this.config.entryLabel : defaultLabelFunc;
        this.listEntries = data.listEntries;
        this.interactionData = data.interactions;
        this.interactions = [];
        this.entries = [];
        this.identifierCounter = 0;
        this.templateUrl = "/js/components/templates/interactiveList.hbs";
    }

    preRender(){
        let self = this;
        return new Promise(function(resolve, reject){
            //build interaction objects
            let outerPromises = [];
            self.listEntries.forEach(listEntry => {
                let entry = {}
                outerPromises.push(new Promise(function(resolve, reject){
                    let promises = [];
                    self.interactionData.forEach(interactionData => {
                        interactionData.value = interactionData.valueFunc(listEntry);
                        promises.push(self.buildInteraction(interactionData))
                    })
                    Promise.all(promises)
                        .then(interactions => {
                            interactions.forEach(interaction=>{
                                self.interactions.push(interaction);
                            })
                            //add interactions to list entry
                            entry.interactions = interactions;
                            entry.label = self.config.entryLabel(listEntry);
                            entry.listEntry = listEntry;
                            self.entries.push(entry);
                            resolve();
                        })
                }))
            })
            Promise.all(outerPromises)
                .then(result => {
                    self.data.entries = self.entries;
                    resolve();
                })
        })

    }

    buildInteraction({type, identifier, value}){
        let self = this;
        let interaction;
        let templateUrl = "/js/components/templates/switchInteraction.hbs";
        switch(type){
            case "switch":
                templateUrl = "/js/components/templates/switchInteraction.hbs";
                break;
            case "input":
                templateUrl = "/js/components/templates/inputInteraction.hbs";
                break;
        }
        const uid = this.getNewIdentifier(type);
        return new Promise(function(resolve, reject){
            $.get(templateUrl, function (templateData) {
                let template = Handlebars.compile(templateData);
                let interaction = new Interaction({type, uid, identifier, template, value});
                resolve(interaction);
            })
        })
    }

    getNewIdentifier(prefix){
        let prefixText = prefix ? prefix + "-" : "";
        return prefixText + this.identifierCounter++;
    }

    postRender(){
        let self = this;
        const list = new MDCList(document.querySelector('.mdc-deprecated-list'));


        this.interactions.forEach(interaction=>{
            //hookup interactions with their dom elements
            const dom = interaction.connectDom();
            if(dom){
                interaction.init();
                let o = new Observer(function({event, data}){
                    self.emitEvent({event: event, data: data});
                });
                interaction.addObserver(o)

            }
        })
    }

    getEntries(){
        return this.entries;
    }
}

class Interaction {
    constructor({type, uid, identifier, template, templateData={}, value}={}){
        this.id = uid;
        this.type = type;
        this.identifier = identifier;
        templateData.id = this.id;
        templateData.identifier = this.identifier;
        templateData.type = this.type;
        this.html = template(templateData);
        this.element = undefined;
        this.value = value
        this.getValFunc = function(){return undefined;}
        this.setValFunc = function(){return undefined;}
        this.observers = [];
    }

    connectDom(){
        //find uid
        let element = document.getElementById(this.id);
        if(!element){
            console.error("Failed to obtain DOM element for interaction: Element not found.");
            return false;
        }
        this.element = element;
        return true;
    }

    init(){
        let self = this;
        switch(this.type){
            case "switch":
                //get mdc container
                let mdcSwitch = document.getElementById(this.id + "__switch");
                const switchControl = new MDCSwitch(mdcSwitch);
                this.getValFunc = function(){
                    return switchControl.selected;
                }
                this.setValFunc = function(value){
                    switchControl.selected = value;
                    return value;
                }
                mdcSwitch.addEventListener("click", function(){
                    self.hasChanged();
                })

                //set value if one was given
                if(this.value) {
                    this.setValue(this.value)
                }
                break;
        }
    }

    setValue(value){
        this.value = this.setValFunc(value);
    }

    getValue(){
        return this.getValFunc();
    }

    hasChanged(){
        const data = {
            value: this.getValue(),
            interaction: this,
        }
        //notify observers
        this.observers.forEach(observer => {
            observer.inform({event: "changed", data: data});
        })
    }

    addObserver(observer){
        this.observers.push(observer);
    }


}

class Observer {
    constructor(resolveFunc){
        this.inform = resolveFunc;
    }
}