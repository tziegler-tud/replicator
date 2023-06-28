import Module from "../module.js"
import Dashboard from "../../classes/dashboard.js";
import ComponentObserver from "../../helpers/componentObserver.js";
import Snackbar from "../../helpers/snackbar";

import {MDCDialog} from '@material/dialog';
import {MDCTextField} from '@material/textfield';
import SkillSelectDialog from "../../components/skillSelectDialog";
import MappingSelect from "../../components/mappingSelect";




export default new Module({
    name: "IntentHandlerActionModule",
    init: function(){

        const snackbar = new Snackbar();

        const dashboardContainer = document.getElementById("dashboard-container");
        let dashboard = new Dashboard({container: dashboardContainer, tabs: true});

        const intentHandler = window.page.intentHandler;
        const skills = window.page.skills;
        const action = window.page.action;
        const entities = window.page.entities;
        const skill = window.page.skill;

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

        $(".button-changeSkill").on("click", function(){
            //skillSelect component
            const skillSelectContainer = document.getElementById("skillSelect-dialog");
            const skillSelect = new SkillSelectDialog({element: skillSelectContainer}, {skills: skills});
            skillSelect.render()
                .then(()=>{
                    //create new observer
                    const skillSelectObserver = new ComponentObserver("confirmed", function(event, data){
                        let newAction = {}
                        newAction.skill = {identifier: data.skill};
                        save({data: newAction, reload: true})
                    })
                    skillSelect.addObserver(skillSelectObserver)
                    skillSelect.open();
                })
        })

        const mappingSelects = $(".mappingSelect");

        mappingSelects.each(function(index, element){
            let variableId = element.dataset.id;
            //find in variable array
            const variable = action.variables.find(e => e._id.toString() === variableId.toString());
            if(variable) {
                const mappingSelect = new MappingSelect({element: element}, {variable: variable, intentHandler: intentHandler, entities: entities});
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

        function save({data, reload=false}){
            //update action
            $.ajax({
                method: "PUT",
                url: "/api/v1/intentHandler/" + intentHandler.identifier + "/action/"+action._id,
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
                url: "/api/v1/intentHandler/" + intentHandler.identifier + "/action/"+action._id,
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
