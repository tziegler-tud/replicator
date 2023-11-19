import Component from "./Component.js"
import "../../scss/components/mappingSelect.scss";
import Handlebars from "handlebars";
import {MDCTextField} from "@material/textfield";
import EntitySelectDialog from "./entitySelectDialog";
import SkillSelectDialog from "./skillSelectDialog";
import ComponentObserver from "../helpers/componentObserver";

export default class MappingSelect extends Component{
    constructor({element, config={}}={}, data={intentHandler: {}, mapping: {}, entities: {}}) {
        super({name: "mappingSelect", element: element, config: config, data: data});


        this.intentHandler = data.intentHandler;
        this.variable = data.variable;
        this.config.enableFallback = true;

        this.stages = {stage1: {}, stage2: {}, stage3: {}};
        this.templateUrl = "/js/components/templates/mappingSelect.hbs";
        this.itemCounter = 0;

        this.types = {
            CONSTANT: "constant",
            VARIABLE: "variable",
            DYNAMIC: "dynamicVariable",
            PROPERTY: "property",
            DYNAMICPROPERTY: "dynamicProperty",
        }

        const defaultMapping = {
            mappingType: this.types.CONSTANT,
            variable: undefined,
            value: {},
            fallback: undefined,
        }

        this.mappingData = Object.assign(defaultMapping, data.variable.mapping);
        //augment descriptions
        this.descriptions = {
            stage1: {
                Constant: {text: "Always use a constant value", icon: "/icons/lightbulb.png"},
                Variable: {text: "Use the value of a intent variable", icon: "/icons/audioFile.png"},
                DynamicVariable: {text: "Assign a constant to all variable options", icon: "/icons/tts.png"},
                Property: {text: "Use a context variable", icon: "/icons/audioFile.png"},
                DynamicProperty: {text: "Assign a constant to context variable assignments", icon: "/icons/tts.png"},
            },
            stage2: {
                light: {text: "Control individual lights", icon: "/icons/floorLamp.png"},
                lightGroup: {text: "Control Groups of lights", icon: "/icons/lightGroup.png"},
                lightScene: {text: "Control Light scenes", icon: "/icons/lightScene.png"},
            },
            stage3: {
                brightness: {text: "Control brightness", icon: "/icons/brightness.png"},
                color: {text: "Control color", icon: "/icons/lightScene.png"},
                state: {text: "Control state", icon: "/icons/power.png"},
            }
        }

        this.fallbackContainer = undefined;
        this.fallback = undefined;
    }

    getStages(){
        return this.stages;
    }

    getMapping(){
        return this.mappingData;
    }

    preRender(){
        let self = this;
        return new Promise(function(resolve, reject){
            resolve();
        })

    }

    postRender(){
        let self = this;

        // self.loadStage1();
        // self.loadStage2();
        // // self.loadStage3();

        this.fallbackContainer = this.container.querySelector(".fallback--container");
        this.fallback = new Fallback({
            container: this.fallbackContainer,
            entitySelect: {
                enabled: true,
                entities: self.data.entities,
            },
            value: this.mappingData.fallback,
        })
        this.fallback.listen("changed", (fallback, data)=>{
            self.change();
        })


        //await finished stage
        self.loadStage1()
            .then(()=>{
                self.updateStages();
        })
    }

    updateStages(args){
        let self = this;
        //load up stage 2
        self.loadStage2()
            .then(result => {
                self.loadStage3();
            })
    }

    buildData(){
        let data = {stages: this.stages};
        this.mappingData = {
            mappingType: this.stages.stage1.getValue(),
            variable: this.stages.stage2.getValue(),
            value: this.stages.stage3.getValue(),
            fallback: this.fallback.getValue(),
        }
        return data;
    }

    getFallbackValue(){
        if(this.fallbackContainer) {

        }
    }

    finish(){
        let data = this.buildData();
        this.emitEvent({event: "finished", data: data});
    }

    change(){
        let data = this.buildData();
        this.emitEvent({event: "changed", data: data});
    }

    loadStage1(){
        //create stage 1 - a simple select
        let self = this;
        return new Promise(function(resolve, reject){
            const stage1Container = self.container.querySelector(".stage1--container");
            let stage1 = new SelectStage({element: stage1Container, level: 1, template: "/js/components/templates/mapping/stage1.hbs"})
            //create options
            let options = [
                {name: "constant", value: "constant"},
                {name: "variable", value: "variable"},
                {name: "dynamic Variable", value: "dynamicVariable"},
                {name: "property", value: "property"},
                {name: "dynamic property", value: "dynamicProperty"},
            ]
            stage1.setOptions(options);
            stage1.finishFunc = function(args){
                self.updateStages(args);
            }
            stage1.render()
                .then(result => {
                    //setup event listener
                    const select = self.container.querySelector(".stage1--select");
                    stage1.selectOption(self.mappingData.mappingType);
                    stage1.getValue = function(){
                        return select.value;
                    }
                    select.addEventListener("change", function(){
                        stage1.finish();
                    })
                    self.stages.stage1 = stage1;
                    resolve(stage1);
                })
        })
    }

    loadStage2(){
        let self = this;
        return new Promise(function(resolve, reject){
            //create stage 2 - another simple select
            const stage2Container = self.container.querySelector(".stage2--container");
            let stage2 = new SelectStage({element: stage2Container, level: 2, template: "/js/components/templates/mapping/stage2.hbs"})

            let stage1Value = self.stages.stage1.getValue();

            let options = [
            ]

            switch(stage1Value){
                case self.types.CONSTANT:
                case self.types.VARIABLE:
                case self.types.DYNAMIC:
                    //create options
                    //options here are variables not forbidden on the intentHandler
                    const required = self.intentHandler.variables.required;
                    const optional = self.intentHandler.variables.optional;

                    if(required) Object.keys(required).forEach(function(variable){
                        options.push({name: variable, value: variable, type: required[variable], required: true})
                    });
                    if(optional) Object.keys(optional).forEach(function(variable){
                        options.push({name: variable, value: variable, type: optional[variable], required: false})
                    });

                    break;
                case self.types.PROPERTY:
                case self.types.DYNAMICPROPERTY:
                    self.intentHandler.properties.forEach(property => {
                        options.push({name: property.key, value: property.key, type: "property", required: false})
                    })
                    break;
            }

            stage2.setOptions(options);

            stage2.finishFunc = function(args){
                self.loadStage3();
            }

            stage2.render()
                .then(result => {
                    let type = self.stages.stage1.getValue();
                    //setup event listener
                    const select = self.container.querySelector(".stage2--select");

                    //disabled if constant
                    if(type === self.types.CONSTANT) {
                        select.disabled = true;
                    }
                    else {
                        stage2.selectOption(self.mappingData.variable);
                    }
                    stage2.getValue = function(){
                        return select.value;
                    }
                    stage2.getType = function(){
                        return select.options[select.selectedIndex].dataset.type;
                    }
                    select.addEventListener("change", function(){
                        stage2.finish();
                    })
                    self.stages.stage2 = stage2;
                    resolve(stage2)
                })
        })
    }

    loadStage3(){
        let self = this;
        //create stage 3
        const stage3Container = self.container.querySelector(".stage3--container");
        stage3Container.innerHTML = "";
        return new Promise(function(resolve, reject){
            //select template depending on stage1 selection
            let template = "";
            let selectedVariable;

            let stage1Value = self.stages.stage1.getValue();
            let stage2Value = self.stages.stage2.getValue();
            let type = stage1Value;
            switch(type){
                case self.types.CONSTANT:
                    template = "/js/components/templates/mapping/stage3-constant.hbs";
                    selectedVariable = "CONSTANT";
                    break;
                case self.types.VARIABLE:
                    template = "/js/components/templates/mapping/stage3-variable.hbs";
                    selectedVariable = stage2Value;
                    break;
                case self.types.DYNAMIC:
                    template = "/js/components/templates/mapping/stage3-dynamic.hbs";
                    selectedVariable = stage2Value;
                    break;
                case self.types.PROPERTY:
                    template = "/js/components/templates/mapping/stage3-property.hbs";
                    selectedVariable = stage2Value;
                    break;
                case self.types.DYNAMICPROPERTY:
                    template = "/js/components/templates/mapping/stage3-dynamicProperty.hbs";
                    selectedVariable = stage2Value;
                    break;
            }
            let stage3 = new InputStage({element: stage3Container, level: 3, template: template})
            //create options
            //options here possible assignment to the slot, each with an input field depending on variable type
            //get slot
            stage3.finishFunc = function(){
                self.finish();
            }

            stage3.changeFunc = function(){
                self.change();
            }
            let options = [];

            switch (type){
                case self.types.DYNAMIC:
                    options = [];
                    let slotTitle = self.stages.stage2.getType();
                    $.ajax({
                        method: "GET",
                        url: "/api/v1/intents/slots/" + slotTitle,
                        contentType: "application/json; charset=UTF-8",
                        dataType: "json",
                    })
                        .done(result => {
                            // const slotOptions =
                            result.values.forEach(function(value){
                                //try to find some values in the current mapping
                                let content = self.mappingData.value[value] ?? "";
                                options.push({name: value, type: "notImplemented", value: content});
                            })
                            stage3.setOptions(options);
                            stage3.render()
                                .then(result => {
                                    //setup event listener
                                    $(".stage3--option").each(function(index, option) {
                                        //find associated input
                                        const input = $(this).find(".stage3--input");
                                        input.on("change", function(){
                                            stage3.change();
                                        })
                                        const entitySelectButton = $(this).find(".stage3--entitySelect").first();
                                        entitySelectButton.on("click", function(){
                                            const container = document.getElementById("entitySelect-dialog");
                                            const entitySelect = new EntitySelectDialog({element: container}, {entities: self.data.entities});
                                            entitySelect.render()
                                                .then(()=>{
                                                    //create new observer
                                                    const entitySelectObserver = new ComponentObserver("confirmed", function(event, data){
                                                        console.log("EntitySelect finished:");
                                                        console.log(JSON.stringify(data));
                                                        input.value = data.entity;
                                                        stage3.change();
                                                    })
                                                    entitySelect.addObserver(entitySelectObserver)
                                                    entitySelect.open();
                                                })
                                        })

                                    })

                                    stage3.getValue = function(){
                                        let data = {}
                                        $(".stage3--option").each(function(element, index) {
                                            const input = $(this).find(".stage3--input");
                                            data[input.data("variable")] = input.val();
                                        });
                                        return data;
                                    }
                                    resolve(stage3);
                                    stage3.finish();
                                })
                        })
                    break;
                case self.types.DYNAMICPROPERTY:
                    options = [];
                    let propertyKey = self.stages.stage2.getValue();
                    const property = self.intentHandler.properties.find(property => property.key === propertyKey);
                    if(property) {
                        property.values.forEach(propertyValue => {
                            let content = self.mappingData.value[propertyValue.value] ?? "";
                            options.push({name: propertyValue.name, variable: propertyValue.value, type: "notImplemented", value: content});
                        })
                    }
                    stage3.setOptions(options);
                    stage3.render()
                        .then(result => {
                            //setup event listener
                            $(".stage3--option").each(function(index, option) {
                                //find associated input
                                const input = $(this).find(".stage3--input");
                                input.on("change", function(){
                                    stage3.change();
                                })
                                const entitySelectButton = $(this).find(".stage3--entitySelect").first();
                                entitySelectButton.on("click", function(){
                                    const container = document.getElementById("entitySelect-dialog");
                                    const entitySelect = new EntitySelectDialog({element: container}, {entities: self.data.entities});
                                    entitySelect.render()
                                        .then(()=>{
                                            //create new observer
                                            const entitySelectObserver = new ComponentObserver("confirmed", function(event, data){
                                                console.log("EntitySelect finished:");
                                                console.log(JSON.stringify(data));
                                                input.val(data.entity);
                                                input.change();
                                            })
                                            entitySelect.addObserver(entitySelectObserver)
                                            entitySelect.open();
                                        })
                                })

                                stage3.getValue = function(){
                                    let data = {}
                                    $(".stage3--option").each(function(element, index) {
                                        const input = $(this).find(".stage3--input");
                                        data[input.data("variable")] = input.val();
                                    });
                                    return data;
                                }
                                resolve(stage3);
                                stage3.finish();
                            })
                        })
                    break;
                case self.types.PROPERTY:
                default:
                    stage3.render()
                        .then(result => {
                            //setup event listener
                            const input = self.container.querySelector(".stage3--input");
                            if(type === self.types.CONSTANT) {
                                input.value = self.mappingData.value["CONSTANT"] ?? "";
                            }
                            input.addEventListener("change", function(){
                                stage3.change();
                            })
                            const entitySelectButton = $(stage3Container).find(".stage3--entitySelect").first();
                            entitySelectButton.on("click", function(){
                                const container = document.getElementById("entitySelect-dialog");
                                const entitySelect = new EntitySelectDialog({element: container}, {entities: self.data.entities});
                                entitySelect.render()
                                    .then(()=>{
                                        //create new observer
                                        const entitySelectObserver = new ComponentObserver("confirmed", function(event, data){
                                            console.log("EntitySelect finished:");
                                            console.log(JSON.stringify(data));
                                            input.value = data.entity;
                                            stage3.change();
                                        })
                                        entitySelect.addObserver(entitySelectObserver)
                                        entitySelect.open();
                                    })
                            })
                            stage3.getValue = function(){
                                let data = {};
                                data[selectedVariable] = input.value;
                                return data;
                            }
                            resolve(stage3);
                            stage3.finish();
                        })
                    break;

            }
            self.stages.stage3 = stage3;
        })
    }
}

class Stage extends Component {
    constructor({element, level, template, data={}, config}) {
        super({name: "stage", element: element, config: config, data: data});
        this.level = level;
        this.templateUrl = template;
        this.data.stage = {};
        this.finishFunc = function(){

        };
        this.changeFunc = function(){

        }
    }

    setOptions(options){
        this.data.stage.options = options;
    }

    onFinished(func){
        this.finishFunc = func;
    }

    finish(args){
        this.finishFunc(args, this);
    }

    change(args){
        this.changeFunc(args, this);
    }

    getValue(){

    }

    postRender(){
        return new Promise(function(resolve, reject){

            resolve();
        })
    }
}

class SelectStage extends Stage {
    constructor({element, level, template, data={}, config}) {
        super({element, level, template, data, config});
        this.select = undefined;
        this.options = [];
    }

    selectOption(value){
        if(this.select){
            this.select.value = value;
        }
    }

    postRender(){
        let self = this;
        return new Promise(function(resolve, reject){
            self.options = self.container.getElementsByClassName("selectStage--option");
            self.select = self.container.querySelector(".stage--select")
            resolve();
        })
    }

}

class InputStage extends Stage {
    constructor({element, level, template, data={}, config}) {
        super({element, level, template, data, config});
    }

    postRender(){
        let self = this;
        return new Promise(function(resolve, reject){
            try {
                const textFields = $(self.container).find(".mdc-text-field");
                textFields.each((index, textField) => {
                    new MDCTextField(textField);
                });
            }
            catch(e){
                console.log("Failed to initialize TextFields.")
            }
            resolve();
        })
    }

}

class Fallback {
    constructor({container, entitySelect={enabled: true, entities: {}}, inputSelector=".fallback--input", value}){
        let self = this;
        this.container = container;
        this.input = this.container.querySelector(inputSelector);
        if(!this.container) {
            console.error("Failed to initialize fallback container: invalid container.");
            return;
        }
        if(!this.input) {
            console.error("Failed to initialize fallback container: input element not found. Looked for: '" + inputSelector + "'");
            return;
        }

        try {
            const textFields = $(this.container).find(".mdc-text-field");
            textFields.each((index, textField) => {
                new MDCTextField(textField);
            });
        }
        catch (e){
            console.warn("Input is not a mdc text field.")
        }

        this.listeners = []

        this.input.addEventListener("change", ()=>{
            self.emitEvent("changed", self.getValue());
        })

        if(value) {
            this.input.value = value;
        }

        if(entitySelect.enabled) {
            const entitySelectButton = $(container).find(".fallback--entitySelect").first();
            entitySelectButton.on("click", function(){
                const selectContainer = document.getElementById("entitySelect-dialog");
                const entitySelectDialog = new EntitySelectDialog({element: selectContainer}, {entities: entitySelect.entities});
                entitySelectDialog.render()
                    .then(()=>{
                        //create new observer
                        const entitySelectObserver = new ComponentObserver("confirmed", function(event, data){
                            console.log("Fallback EntitySelect finished:");
                            console.log(JSON.stringify(data));
                            self.input.value = data.entity;
                            let e = new Event("change");
                            self.input.dispatchEvent(e);
                        })
                        entitySelectDialog.addObserver(entitySelectObserver)
                        entitySelectDialog.open();
                    })
            })
        }
    }

    getValue(){
        return this.input.value;
    }

    emitEvent(event, data){
        let self = this;
        //find listeners
        let listeners = this.listeners.filter(listener => listener.event === event)
        listeners.forEach(listener => {
            listener.func(self, data)
        })
    }

    listen(event, func){
        this.listeners.push({
            event: event,
            func: func,
        })
    }
}