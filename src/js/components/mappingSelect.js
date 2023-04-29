import Component from "./Component.js"
import "../../scss/components/mappingSelect.scss";
import Handlebars from "handlebars";
import {MDCTextField} from "@material/textfield";

export default class MappingSelect extends Component{
    constructor({element, config={}}={}, data={intentHandler: {}}) {
        super({name: "mappingSelect", element: element, config: config, data: data});


        this.intentHandler = data.intentHandler;
        this.variable = data.variable;

        this.stages = {stage1: {}, stage2: {}, stage3: {}};
        this.templateUrl = "/js/components/templates/mappingSelect.hbs";
        this.itemCounter = 0;

        //augment descriptions
        this.descriptions = {
            stage1: {
                Constant: {text: "Always use a constant value", icon: "/icons/lightbulb.png"},
                Variable: {text: "Use the value of a intent variable", icon: "/icons/audioFile.png"},
                DynamicVariable: {text: "Assign a constant to all variable options", icon: "/icons/tts.png"},
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
    }

    preRender(){
        let self = this;
        return new Promise(function(resolve, reject){
            resolve();
        })

    }

    postRender(){
        let self = this;

        self.loadStage1();
        self.loadStage2();
        // self.loadStage3();

        //await finished stage
        self.loadStage1()
            .then(()=>{
                // //load up stage 2
                self.loadStage2()
                    .then(result => {
                        self.loadStage3();
                        //await finished stage
                        self.stages.stage2.onFinished(function(selectedItem){
                            //load up stage 2
                            self.loadStage3();
                            //     self.stages.stage3.onFinished(function(selectedItem){
                            //         //load up stage 2
                            //         self.finish();
                            //         })
                        })
                    })
        })
    }

    finish(){
        this.emitEvent({event: "finished", data: {skill: this.selectedSkill}});
    }

    loadStage1(){
        //create stage 1 - a simple select
        let self = this;
        return new Promise(function(resolve, reject){
            const stage1Container = document.getElementById("stage1--container");
            let stage1 = new Stage({element: stage1Container, level: 1, template: "/js/components/templates/mapping/stage1.hbs"})
            //create options
            let options = [
                {name: "constant", value: "constant"},
                {name: "variable", value: "variable"},
                {name: "dynamic Variable", value: "dynamicVariable"},
            ]
            stage1.setOptions(options);
            stage1.render()
                .then(result => {
                    //setup event listener
                    const select = document.getElementById("stage1--select");
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
            const stage2Container = document.getElementById("stage2--container");
            let stage2 = new Stage({element: stage2Container, level: 2, template: "/js/components/templates/mapping/stage2.hbs"})
            //create options
            //options here are variables not forbidden on the intentHandler
            const required = self.intentHandler.variables.required;
            const optional = self.intentHandler.variables.optional;
            let options = [
            ]
            if(required) Object.keys(required).forEach(function(variable){
                options.push({name: variable, value: variable, type: required[variable], required: true})
            });
            if(optional) Object.keys(optional).forEach(function(variable){
                options.push({name: variable, value: variable, type: optional[variable], required: false})
            });
            stage2.setOptions(options);

            stage2.render()
                .then(result => {
                    //setup event listener
                    const select = document.getElementById("stage2--select");
                    //disabled if constant
                    if(self.stages.stage1.getValue() === "constant") {
                        select.disabled = true;
                    }
                    stage2.getValue = function(){
                        return select.value;
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
        //create stage 2 - another simple select
        const stage3Container = document.getElementById("stage3--container");
        stage3Container.innerHTML = "";
        //select template depending on stage1 selection
        let template = "";
        switch(this.stages.stage1.getValue()){
            case "constant":
                template = "/js/components/templates/mapping/stage3-constant.hbs";
                break;
            case "variable":
                template = "/js/components/templates/mapping/stage3-variable.hbs";
                break;
            case "dynamicVariable":
                template = "/js/components/templates/mapping/stage3-dynamic.hbs";
                break;
        }
        let stage3 = new Stage({element: stage3Container, level: 3, template: template})
        //create options
        //options here possible assignment to the slot, each with an input field depending on variable type
        //get slot
        let slotTitle = this.stages.stage2.getValue();
        $.ajax({
            method: "GET",
            url: "/api/v1/intents/slots/" + slotTitle,
            contentType: "application/json; charset=UTF-8",
            dataType: "json",
        })
            .done(result => {
                // const slotOptions =
                let options = [
                ]
                result.values.forEach(function(value){
                    options.push({name: value, type: "notImplemented"})
                })
                stage3.setOptions(options);
                stage3.render();
            })
        this.stages.stage3 = stage3;

    }
}

class Stage extends Component {
    constructor({element, level, template, data={}, config={}}) {
        super({name: "stage", element: element, config: config, data: data});
        this.level = level;
        this.templateUrl = template;
        this.data.stage = {}
        this.finishFunc = function(){};
    }

    setOptions(options){
        this.data.stage.options = options;
    }

    onFinished(func){
        this.finishFunc = func;
    }

    finish(args){
        this.finishFunc(args, this)
    }

    getValue(){

    }

    postRender(){
        return new Promise(function(resolve, reject){
            try {
                const textFields = $(".mdc-text-field");
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