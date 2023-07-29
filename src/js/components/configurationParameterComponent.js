import Component from "./Component.js"
import {MDCList} from '@material/list';
import Handlebars from "handlebars";
import "../helpers/handlebarsHelpers.js"
import {MDCTextField} from "@material/textfield";

import "../../scss/components/configParameterComponent.scss";

export default class ConfigurationParameterComponent extends Component {
    constructor({element, config={}, data={header: "", body: ""}}) {
        super({name: "configurationParameter", element: element, config: config, data: data});
        this.templateUrl = "/js/components/templates/configurationParameter.hbs";
    }

    async preRender(){
        let self = this;
        if(self.data.value===undefined) self.data.value = self.data.default;
        return true;
    }

    async postRender(){
        let self = this;
        return new Promise(function(resolve, reject){
            const textFields = $(self.container).find(".mdc-text-field");
            const inputs = $(self.container).find(".configParamter-input");
            try {
                textFields.each((index, textField) => {
                    const mdcTextField = new MDCTextField(textField);
                })
            }
            catch(e){
                console.log("Failed to initialize TextFields.")
            }
            inputs.each(function(index, element){
                this.addEventListener("change", function(){
                    self.emitEvent({event: "changed", data: {value: this.value}})
                })
            })
            resolve();
        })
    }

}