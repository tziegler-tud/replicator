import Module from "../module.js"
import {MDCTextField} from "@material/textfield";
import Snackbar from "../../helpers/snackbar";


export default new Module({
    name: "AlertsModule",
    init: function(){
        const snackbar = new Snackbar();

        const alerts = window.page.alerts;
        const entities = window.page.entities;
        const skills = window.page.skills;
        try {
            const textField = new MDCTextField(document.querySelector('.mdc-text-field'));
        }
        catch(e){
            console.log("Failed to initialize TextFields.")
        }


        $(".alert-card").click(function(){
            window.location.href= "/alerts/" + this.dataset.name;
        })
    }
})
