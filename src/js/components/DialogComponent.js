import Component from "./Component.js"
import "../../scss/components/dialogComponent.scss";
import {MDCDialog} from "@material/dialog";

export default class DialogComponent extends Component{
    constructor({element, config={}}={}, data={}) {
        super({name: "dialogComponent", element: element, config: config, data: data})
        element.classList.add("mdc-dialog");

    }

    async render(){
        await super.render();
        this.dialog = new MDCDialog(this.container);
    }

    open(){
        if(!this.dialog) {
            console.error("Failed to open DialogComponent: Dialog not initialized. Did you render the component?")
        }
        this.dialog.open();
    }

    close(){
        if(!this.dialog) {
            console.error("Failed to open DialogComponent: Dialog not initialized. Did you render the component?")
        }
        this.dialog.close();
    }
}