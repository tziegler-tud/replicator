import Component from "./Component.js"
import "../../scss/components/entitySelectDialog.scss";
import Handlebars from "handlebars";
import DialogComponent from "./DialogComponent";
import {MDCList} from "@material/list";

export default class EntitySelectDialog extends DialogComponent{
    constructor({element, config={}}={}, data={entities: {}}) {
        super({name: "entitySelect", element: element, config: config, data: data});

        this.entities = data.entities;
        this.stages = {};
        this.selected = undefined;
        this.templateUrl = "/js/components/templates/entitySelectDialog.hbs";
        this.itemCounter = 0;

        //augment descriptions
        this.descriptions = {
            stage1: {
                lights: {text: "Control individual lights", icon: "/icons/floorLamp.png"},
                lightGroups: {text: "Control Groups of lights", icon: "/icons/lightGroup.png"},
                scenes: {text: "Control Light scenes", icon: "/icons/lightScene.png"},
            },
            stage2: {

            },
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

        //setup buttons
        this.cancelButton = document.getElementById("entitySelectDialog-cancel-button")
        this.backButton = document.getElementById("entitySelectDialog-back-button")
        this.confirmButton = document.getElementById("entitySelectDialog-confirm-button")

        this.backButton.addEventListener("click", function(e){
            e.preventDefault();
            e.stopPropagation();
            self.loadPreviousStage();
        })

        this.confirmButton.addEventListener("click", function(e){
            self.finish();
            self.close();
        })


        self.loadStage1();

        //await finished stage
        self.stages.stage1.onFinished(function(selectedItem){
            //load up stage 2
            self.loadStage2();
            self.backButton.disabled = false;
            //await finished stage
            self.stages.stage2.onFinished(function(selectedItem){
                //load up stage 2
                self.selected = self.stages.stage2.selectedItem.value;
                self.confirmButton.disabled = false;
            })
        })
    }

    finish(){
        this.emitEvent({event: "confirmed", data: {entity: this.selected}});
    }

    loadPreviousStage(){
        if(this.currentStage.previousStage) this.showStage(this.currentStage.previousStage);
    }

    loadStage1(){
        //build first stage
        const heading = "What do you want to do?"
        const stage1 = new Stage(1, heading, undefined);
        //get first-level options
        let stage1Options = Object.keys(this.entities);
        //add stage items
        stage1Options.forEach(optionName=> {
            const description = this.descriptions.stage1[optionName] ? this.descriptions.stage1[optionName] : {};
            const item = new StageItem({
                title: optionName,
                text: description.text,
                icon: description.icon,
                value: optionName,
            }, this.itemCounter++);
            stage1.addItem(item);
        })
        this.backButton.disabled = true;
        this.stages.stage1 = stage1;
        this.previousStage = this.stages.stage1;

        this.showStage(stage1);
    }

    loadStage2(){
        //get selected value from stage1
        const stage1Selected = this.stages.stage1.selectedItem;

        const heading = "Select entity"
        const stage2 = new Stage(2, heading, this.stages.stage1);

        let stage2Options = this.entities[stage1Selected.value];
        //add stage items
        stage2Options.forEach(entity=> {
            const item = new StageItem({
                title: entity.identifier,
                text: (entity.properties.groupName ? entity.properties.groupName + " | " : "") + entity.uniqueId,
                value: entity.uniqueId,
            }, this.itemCounter++, {showIcon: false});
            stage2.addItem(item);
        })

        this.stages.stage2 = stage2;
        this.showStage(stage2);

    }

    showStage(stage){
        let self = this;
        const stageLevel = stage.level;
        //collapse all stages
        Object.keys(this.stages).forEach(stageKey => {
            const stage = self.stages[stageKey];
            stage.hide();
        })
        stage.show();
        this.currentStage = stage;
    }
}

class Stage {
    constructor(level, heading, previous) {
        this.level = level;
        this.domId = "entitySelectDialog-stage"+level
        this.items = [];
        this.element = document.getElementById(this.domId);
        this.contentContainer = document.getElementById(this.domId +"--content");
        this.heading = heading;
        this.previousStage = previous;
    }

    addItem(item){
        this.items.push(item);
    }

    setupEventListeners(){
        let self = this;
        this.items.forEach(item => {
            if(item.element){
                item.element.addEventListener("click", function(){
                    //remove selected from all others
                    self.items.forEach(item => {
                        item.element.classList.remove("selected");
                    })
                    //mark element as selected
                    item.element.classList.add("selected");
                    self.selectedItem = item;
                    self.setFinished();
                })
            }
        })

    }
    setFinished(finished = true){
        this.finished = finished;
        if(finished) {
            this.element.classList.add("stage-finished");
            this.finishFunc(this.selectedItem);
        }
        else {
            this.element.classList.remove("stage-finished");
        }


    }

    setActive(active=true){
        this.active = active;
        if(active) {
            this.element.classList.add("entitySelectDialog-stage-active");
        }
        else {
            this.element.classList.remove("entitySelectDialog-stage-active");
        }
    }

    onFinished(func){
        this.finishFunc = func;
    }

    loadHtml(){
        let self = this;
        self.contentContainer.innerHTML = "";
        this.items.forEach(item => {
            self.contentContainer.append(item.generateHtml())
        })
        this.list = new MDCList(self.contentContainer);
    }

    show(){
        this.loadHtml();
        this.setupEventListeners();
        this.setActive();
        this.setFinished(false);
    }

    hide(){
        this.contentContainer.innerHTML = "";
        this.setActive(false);
    }
}

class StageItem {
    constructor({title, text, icon, value}, counter, {showIcon=true, showNext=true}={}) {
        this.title = title;
        this.text = text;
        this.icon = icon;
        this.value = value;
        this.domId = "stageItem-"+counter;
        this.config = {
            showIcon: showIcon,
            showNext: showNext,
        }
        //add event listener
    }

    generateHtml(){
        let container = document.createElement("li");
        container.className = "entitySelectDialog-stage-item mdc-deprecated-list-item";
        container.id = this.domId;
        container.role = "option";

        let ripple = document.createElement("span");
        ripple.className = "mdc-deprecated-list-item__ripple";

        let text = document.createElement("span");
        text.className = "mdc-deprecated-list-item__text";

        let primaryText = document.createElement("span");
        primaryText.className = "mdc-deprecated-list-item__primary-text stage-item--title";
        primaryText.innerHTML = this.title;

        let secondaryText = document.createElement("span");
        secondaryText.className = "mdc-deprecated-list-item__secondary-text stage-item--content";
        secondaryText.innerHTML = this.text;


        text.append(primaryText);
        text.append(secondaryText);
        container.append(ripple);
        if(this.config.showIcon){
            let icon = document.createElement("span");
            icon.className = "mdc-deprecated-list-item__graphic stage-item--icon";
            let iconInner = document.createElement("img");
            iconInner.src = this.icon;
            icon.appendChild(iconInner);
            container.append(icon)
        }
        container.append(text);
        if (this.config.showNext){
            let meta = document.createElement("span");
            meta.className = "mdc-deprecated-list-item__meta";

            let button = document.createElement("button");
            button.className="mdc-icon-button material-icons";
            button.innerHTML = "chevron_right";

            meta.append(button);
            container.append(meta);
        }
        this.element = container;

        return container;
    }
}