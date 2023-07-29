import Component from "./Component.js"
import {MDCList} from '@material/list';
import Handlebars from "handlebars";
import "../../scss/components/linesPreview.scss";

export default class LinesPreview extends Component {
    constructor({element, config={}, data={header: "", body: ""}}) {
        super({name: "linesPreview", element: element, config: config, data: data});
        this.templateUrl = "/js/components/templates/linesPreview.hbs";
    }

    preRender(){
        let self = this;
        //check which lines are enabled. data.variables is an Object containing 3 arrays: optional, required, forbidden. Arrays contain variable names
        this.data.lines.forEach(function(line){
            line.enabled = true;
            line.depends = false;
            //parse to variable names, they are behin the double-colon
            const slotsInLine = []
            const optionalSlotsInLine = []
            line.groups.slots.forEach(function(slot){
                //find :
                const pos = slot.indexOf(":");
                slotsInLine.push(slot.substring(pos+1));
            })
            line.groups.slotsOptional.forEach(function(slot){
                //find :
                const pos = slot.indexOf(":");
                optionalSlotsInLine.push(slot.substring(pos+1));
            })
            self.data.variables.required.forEach(function(requiredVar){
                if(!slotsInLine.includes(requiredVar)){
                    //check if in optionals
                    //if the required var is only optional, the line might be disabled
                    if(optionalSlotsInLine.includes(requiredVar)){
                        line.depends = true;
                    }
                    //line is disabled if it cannot not contain a required variable
                    else {
                        //disable line
                        line.enabled = false;
                    }
                }

            })
            //line is disabled if it contains a forbidden variable
            self.data.variables.forbidden.forEach(function(requiredVar){
                if(slotsInLine.includes(requiredVar)){
                    //disable line
                    line.enabled = false;
                }
                else {
                    //check if in optionals
                    //line might be disabled if a forbidden var is optional
                    if(optionalSlotsInLine.includes(requiredVar)){
                        line.depends = true;
                    }
                }
            })
        })
    }

    postRender(){
        const list = new MDCList(document.querySelector('.mdc-deprecated-list'));
    }

}