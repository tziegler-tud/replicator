import Module from "../module.js"
import {MDCTextField} from "@material/textfield";
import Snackbar from "../../helpers/snackbar";
import SkillSelectDialog from "../../components/skillSelectDialog";
import ComponentObserver from "../../helpers/componentObserver";
import MappingSelect from "../../components/mappingSelect";
import ConfigurationParameterComponent from "../../components/configurationParameterComponent";
import MappingSelectAlert from "../../components/mappingSelectAlert";
import Dashboard from "../../classes/dashboard";


export default new Module({
    name: "AlertsActionModule",
    init: function(){
        const snackbar = new Snackbar();

        const alert = window.page.alert;
        const alerts = window.page.alerts;
        const entities = window.page.entities;
        const skills = window.page.skills;
        const skill = window.page.skill;
        const action = window.page.action;

        const dashboardContainer = document.getElementById("dashboard-container");
        let dashboard = new Dashboard({container: dashboardContainer, tabs: true});

        try {
            const textField = new MDCTextField(document.querySelector('.mdc-text-field'));
        }
        catch(e){
            console.log("Failed to initialize TextFields.")
        }

        const backButton = document.getElementById("dashboard-back-button");
        backButton.addEventListener("click", function(){
            window.location.href = "../"
        })

        const saveButton = document.getElementById("dashboard-save-button");
        saveButton.addEventListener("click", function(){
            save({data: action});
        })

        const deleteButton = document.getElementById("dashboard-delete-button");
        deleteButton.addEventListener("click", function(){
            remove();
        })

        const mappingSelects = $(".mappingSelect");

        mappingSelects.each(function(index, element){
            let variableId = element.dataset.id;
            //find in variable array
            const variable = action.variables.find(e => e._id.toString() === variableId.toString());
            if(variable) {
                const mappingSelect = new MappingSelectAlert({element: element}, {variable: variable, alert: alert, entities: entities});
                mappingSelect.render()
                    .then(()=>{
                        //create new observer
                        const mappingSelectObserver = new ComponentObserver(["finished","changed"], function(event, data) {
                            console.log("MappingSelect finished.");
                            variable.mapping = mappingSelect.getMapping();
                        })
                        mappingSelect.addObserver(mappingSelectObserver)
                    })
            }
            else {
                console.warn("Failed to update variable: variable with ID: " + variableId + " not found in array.");
            }
        })

        const configurationParameters = $(".action-configuration-entry");
        configurationParameters.each(function(index, element) {
            const identifier = this.dataset.identifier;
            if(action.configuration.parameters) {
                const index = action.configuration.parameters.findIndex(param => param.identifier === identifier);
                if(index >= 0){
                    const parameter = action.configuration.parameters[index];
                    const type = parameter.type;
                    const title = parameter.title ?? parameter.identifier;
                    const defaultValue = parameter.default;
                    const value = parameter.value;
                    const options = parameter.options;
                    const comp = new ConfigurationParameterComponent({element: this, config: {}, data: {type: type, identifier: identifier, title: title, default: defaultValue, value: value, options: options}});
                    comp.render()
                        .then(()=>{
                            //create new observer
                            const configurationParameterObserver = new ComponentObserver(["finished","changed"], function(event, data) {
                                //update action
                                action.configuration.parameters[index].value = data.value;
                            })
                            comp.addObserver(configurationParameterObserver)
                        })
                        .catch(err => {
                            console.error("Failed to render configurationParameterComponent on element " + this + ": " + err);
                        })
                }
            }

        })

        function save({data, reload=false}){
            //update action
            $.ajax({
                method: "PUT",
                url: "/api/v1/alerts/" + alert.identifier + "/actions/"+action._id,
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    snackbar.show("Action saved successfully.");
                    if(reload){
                        window.location.reload();
                    }
                })
        }

        function remove(){
            //get enabled clients from component
            $.ajax({
                method: "DELETE",
                url: "/api/v1/alerts/" + alert.identifier + "/actions/"+action._id,
                data: {},
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    window.location.href = "../"
                })
        }
    }
})
