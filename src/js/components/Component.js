import Handlebars from "handlebars";
import { v4 as uuidv4 } from 'uuid';
import "../../scss/components/component.scss";

export default class Component {
    constructor({name, element, config={}, data={}}){
        this.componentName = name
        this.container = element;
        this.templateUrl = "./templates/default.hbs";
        this.data = data;
        this.id = name + "-"+ uuidv4();

        const defaultClassName = name + "-component-container"
        let defaultConfig = {
            container: {
                classes: [defaultClassName],
            }
        }
        this.config = Object.assign(defaultConfig, config);
        this.observers = [];
    }

    getTemplateData(){
        return {
            id: this.id,
            componentName: this.componentName,
            config: this.config,
            data: this.data,
        }
    }

    setData(data){
        this.data = data;
    }

    async render({pre=true, post=true}={}) {
        let self = this;
        if(pre) await self.preRender();
        //load template
        let templateData = await $.get(this.templateUrl);

        let template = Handlebars.compile(templateData);
        let data = self.getTemplateData();
        let html = template(data)
        //append template to container
        self.container.innerHTML = html;
        //add class to container
        self.container.classList.add(self.config.container.classes);
        if(post)self.postRender();
    }

    preRender(){

    }

    postRender(){

    }

    addObserver(observer){
        this.observers.push(observer);
    }

    emitEvent({event, data}){
        this.observers.forEach(observer=>{
            observer.inform({event: event, data: data})
        })
    }
}