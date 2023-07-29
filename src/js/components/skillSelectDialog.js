import Component from "./Component.js"
import "../../scss/components/skillSelectDialog.scss";
import Handlebars from "handlebars";
import DialogComponent from "./DialogComponent";
import {MDCList} from "@material/list";

export default class SkillSelectDialog extends DialogComponent{
    constructor({element, config={}}={}, data={skills: {}}) {
        super({name: "skillSelect", element: element, config: config, data: data});

        this.skills = data.skills;
        this.stages = {};
        this.selectedSkill = undefined;
        this.templateUrl = "/js/components/templates/skillSelectDialog.hbs";
        this.itemCounter = 0;

        //augment descriptions
        this.descriptions = {
            stage1: {
                Light: {text: "Control Lights and Scenes.", icon: "/icons/lightbulb.png"},
                Sound: {text: "Play sounds", icon: "/icons/audioFile.png"},
                Voice: {text: "Use text-to-speech output", icon: "/icons/tts.png"},
                Music: {text: "Control music playback", icon: "/icons/speaker.png"},
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

        //setup buttons
        this.cancelButton = document.getElementById("skillSelectDialog-cancel-button")
        this.backButton = document.getElementById("skillSelectDialog-back-button")
        this.confirmButton = document.getElementById("skillSelectDialog-confirm-button")

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
                self.loadStage3();
                self.stages.stage3.onFinished(function(selectedItem){
                    //load up stage 2
                    self.loadStage4();
                    self.stages.stage4.onFinished(function(selectedItem){
                        //load up stage 2
                        self.selectedSkill = self.stages.stage4.selectedItem.value;
                        self.confirmButton.disabled = false;
                    })
                })
            })
        })
    }

    finish(){
        this.emitEvent({event: "confirmed", data: {skill: this.selectedSkill}});
    }

    loadPreviousStage(){
        if(this.currentStage.previousStage) this.showStage(this.currentStage.previousStage);
    }

    loadStage1(){
        //build first stage
        const heading = "What do you want to do?"
        const stage1 = new Stage(1, heading, undefined);
        //get first-level options
        let stage1Options = Object.keys(this.skills);
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

        const heading = "Select your case"
        const stage2 = new Stage(2, heading, this.stages.stage1);

        let stage2Options = Object.keys(this.skills[stage1Selected.value]);
        //add stage items
        stage2Options.forEach(optionName=> {
            const description = this.descriptions.stage2[optionName] ? this.descriptions.stage2[optionName] : {};
            const item = new StageItem({
                title: optionName,
                text: description.text,
                icon: description.icon,
                value: optionName,
            }, this.itemCounter++);
            stage2.addItem(item);
        })

        this.stages.stage2 = stage2;
        this.showStage(stage2);

    }

    loadStage3(){
        //get selected value from stage1
        const stage1Selected = this.stages.stage1.selectedItem;
        const stage2Selected = this.stages.stage2.selectedItem;

        const stage3 = new Stage(3, "", this.stages.stage2);

        let stage3Options = Object.keys(this.skills[stage1Selected.value][stage2Selected.value]);
        //add stage items
        stage3Options.forEach(optionName => {
            const description = this.descriptions.stage3[optionName] ? this.descriptions.stage3[optionName] : {};
            const item = new StageItem({
                title: optionName,
                text: description.text,
                icon: description.icon,
                value: optionName,
            }, this.itemCounter++);
            stage3.addItem(item);
        })
        this.stages.stage3 = stage3;
        this.previousStage = this.stages.stage2;
        this.showStage(stage3);

    }

    loadStage4(){
        //get selected value from stage1
        const stage1Selected = this.stages.stage1.selectedItem;
        const stage2Selected = this.stages.stage2.selectedItem;
        const stage3Selected = this.stages.stage3.selectedItem;

        const stage4 = new Stage(4, "", this.stages.stage3);

        const skillsAvailable = this.skills[stage1Selected.value][stage2Selected.value][stage3Selected.value];
        let stage4Options = Object.keys(skillsAvailable);
        //add stage items
        stage4Options.forEach(skillName => {
            const skill = skillsAvailable[skillName]
            const item = new StageItem({
                title: skill.identifier,
                text: skill.description,
                icon: "",
                value: skill.identifier,
            }, this.itemCounter++, {showIcon: false, showNext: false});
            stage4.addItem(item);
        })

        this.stages.stage4 = stage4;
        this.previousStage = this.stages.stage3;
        this.showStage(stage4);

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
        this.domId = "skillSelectDialog-stage"+level
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
            this.element.classList.add("skillSelectDialog-stage-active");
        }
        else {
            this.element.classList.remove("skillSelectDialog-stage-active");
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
        container.className = "skillSelectDialog-stage-item mdc-deprecated-list-item";
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