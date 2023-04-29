import Component from "./Component.js"
import "../../scss/components/skillSelect.scss";
import Handlebars from "handlebars";

export default class SkillSelect extends Component{
    constructor({element, config={}}={}, data={skills: {}}) {
        super({name: "skillSelect", element: element, config: config, data: data});

        this.skills = data.skills;
        this.stages = {stage1: {}, stage2: {}, stage3: {}};
        this.selectedSkill = undefined;
        this.templateUrl = "/js/components/templates/skillSelect.hbs";
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

        self.loadStage1();

        //await finished stage
        self.stages.stage1.onFinished(function(selectedItem){
            //load up stage 2
            self.loadStage2();
            //await finished stage
            self.stages.stage2.onFinished(function(selectedItem){
                //load up stage 2
                self.loadStage3();
                self.stages.stage3.onFinished(function(selectedItem){
                    //load up stage 2
                    self.loadStage4();
                    self.stages.stage4.onFinished(function(selectedItem){
                        //load up stage 2
                        self.selectedSkill = self.stages.stage4.value;
                        self.finish();
                    })
                })
            })
        })
    }

    finish(){
        this.emitEvent({event: "finished", data: {skill: this.selectedSkill}});
    }

    loadStage1(){
        //build first stage
        const heading = "What do you want to do?"
        const stage1 = new Stage(1, heading);
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

        this.showStage(stage1);
        this.stages.stage1 = stage1;
    }

    loadStage2(){
        //get selected value from stage1
        const stage1Selected = this.stages.stage1.selectedItem;

        const heading = "Select your case"
        const stage2 = new Stage(2, heading);

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

        this.showStage(stage2);
        this.stages.stage2 = stage2;
    }

    loadStage3(){
        //get selected value from stage1
        const stage1Selected = this.stages.stage1.selectedItem;
        const stage2Selected = this.stages.stage2.selectedItem;

        const stage3 = new Stage(3);

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
        this.showStage(stage3);
        this.stages.stage3 = stage3;
    }

    loadStage4(){
        //get selected value from stage1
        const stage1Selected = this.stages.stage1.selectedItem;
        const stage2Selected = this.stages.stage2.selectedItem;
        const stage3Selected = this.stages.stage3.selectedItem;

        const stage4 = new Stage(4);

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
            }, this.itemCounter++);
            stage4.addItem(item);
        })

        this.showStage(stage4);
        this.stages.stage4 = stage4;
    }

    showStage(stage){
        let self = this;
        const stageLevel = stage.level;
        //collapse all stages HIGHER
        Object.keys(this.stages).forEach(stageKey => {
            const stage = self.stages[stageKey];
            if(stage.level > stageLevel) stage.hide();
        })
        stage.show();

    }
}

class Stage {
    constructor(level, heading) {
        this.level = level;
        this.domId = "stage"+level;
        this.items = [];
        this.element = document.getElementById("stage"+level);
        this.contentContainer = document.getElementById("stage"+level+"--content");
        this.heading = heading;
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
        this.setActive(false);
        if(finished) {
            this.element.classList.add("stage-finished");
            this.finishFunc(this.selectedItem)
        }
        else {
            this.element.classList.remove("stage-finished");
        }


    }

    setActive(active=true){
        this.active = active;
        if(active) {
            this.element.classList.add("skillSelect-stage-active");
        }
        else {
            this.element.classList.remove("skillSelect-stage-active");
        }
    }

    onFinished(func){
        this.finishFunc = func;
    }

    loadHtml(){
        let self = this;
        // let container = document.createElement("div");
        // container.className = "skillSelect-stage";
        // container.id = "stage"+this.level;
        //
        // let heading = document.createElement("div");
        // heading.className = "skillSelect-stage-heading";
        // heading.id = "stage"+this.level+"--heading";
        // heading.innerHTML = this.heading;
        //
        //
        // let content = document.createElement("div");
        // content.className = "skillSet-stage-content";
        // content.id = "stage"+this.level+"-content"
        self.contentContainer.innerHTML = "";
        this.items.forEach(item => {
            self.contentContainer.append(item.generateHtml())
        })
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
    constructor({title, text, icon, value}, counter) {
        this.title = title;
        this.text = text;
        this.icon = icon;
        this.value = value;
        this.domId = "stageItem-"+counter;
        //add event listener
    }

    generateHtml(){
        let container = document.createElement("div");
        container.className = "skillSelect-stage-item";
        container.id = this.domId;
        let overlay = document.createElement("div")
        overlay.className = "disabled-overlay";

        let icon = document.createElement("div");
        icon.className = "stage-item--icon";
        let iconInner = document.createElement("img");
        iconInner.src = this.icon;
        icon.appendChild(iconInner);

        let title = document.createElement("div");
        title.className = "stage-item--title";
        title.innerHTML = this.title;

        let content = document.createElement("div");
        content.className = "stage-item--content";
        content.innerHTML = this.text;
        container.append(overlay);
        container.append(icon);
        container.append(title);
        container.append(content);

        this.element = container;

        return container;
    }
}