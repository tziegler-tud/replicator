import Module from "../module.js"
import {MDCTextField} from "@material/textfield";
import Snackbar from "../../helpers/snackbar";
import EntitySelectDialog from "../../components/entitySelectDialog";
import ComponentObserver from "../../helpers/componentObserver";
import SkillSelectDialog from "../../components/skillSelectDialog";
import InteractiveList from "../../components/interactiveList";


export default new Module({
    name: "AlertsDetailsModule",
    init: function(){
        const snackbar = new Snackbar();

        const alert = window.page.alert;
        const alerts = window.page.alerts;
        const entities = window.page.entities;
        const skills = window.page.skills;
        try {
            const textField = new MDCTextField(document.querySelector('.mdc-text-field'));
        }
        catch(e){
            console.log("Failed to initialize TextFields.")
        }

        const priorityInput = document.querySelector("#alert-input--priority");
        const maxDurationInput = document.querySelector("#alert-input--maxDuration");

        //actions
        $(".dashboard-action-item").on("click", function(event){
            window.location.href = "/alerts/"+ alert.identifier + "/actions/"+this.dataset.actionid;
        })

        $(".button-addAction").on("click", function(){
            //skillSelect component
            const phaseIndex = this.dataset.phase;
            const skillSelectContainer = document.getElementById("skillSelect-dialog");
            const skillSelect = new SkillSelectDialog({element: skillSelectContainer}, {skills: skills});
            skillSelect.render()
                .then(()=>{
                    //create new observer
                    const skillSelectObserver = new ComponentObserver("confirmed", function(event, data){
                        addAction(data.skill, phaseIndex);
                    })
                    skillSelect.addObserver(skillSelectObserver)
                    skillSelect.open();
                })
        })

        $(".dashboard-save-button").on("click", function(){
            save()
        })

        $(".button-addPhase").on("click", function(){
            addPhase()
        })

        $(".button-removePhase").on("click", function(){
            removePhase()
        })

        function save(){
            let data = {
                priority: priorityInput ? priorityInput.value : undefined,
                maxDuration: maxDurationInput ? maxDurationInput.value : undefined,
            }
            $.ajax({
                method: "PUT",
                url: "/api/v1/alerts/" + alert.identifier,
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    location.reload();
                })
        }

        function addPhase(){
            let data = {
            }
            $.ajax({
                method: "POST",
                url: "/api/v1/alerts/" + alert.identifier + "/addPhase",
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    location.reload();
                })
        }

        function removePhase(){
            let data = {
            }
            $.ajax({
                method: "POST",
                url: "/api/v1/alerts/" + alert.identifier + "/removePhase",
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    location.reload();
                })
        }

        function addAction(skillIdentifier, phaseIndex){
            let data = {
                action: {
                    skill: {
                        identifier: skillIdentifier
                    }
                },
                phase: phaseIndex,
            }
            $.ajax({
                method: "POST",
                url: "/api/v1/alerts/" + alert.identifier + "/addAction",
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    window.location.href = "/alerts/"+ alert.identifier +  "/actions/"+result._id;
                })
        }


        const phaseSettingsContainers = document.querySelectorAll(".phaseSettingsList");




        phaseSettingsContainers.forEach(container => {
            const phase = alert.phases.find(phase => parseInt(phase.index) === parseInt(container.dataset.index));
            const phaseSettings = [
                {
                    label: "Duration (ms)",
                    key: "duration",
                    value: phase.duration
                },
            ];
            const phaseSettingsInteraction = {
                type: "number",
                identifier: "input-settings-data",
                valueFunc: function(entry){
                    return (entry.value);
                },
                params: {
                    disabled: false,
                    readonly: false,
                    step: 100,
                }
            }
            let phaseSettingsData = {
                listEntries: phaseSettings,
                interactions: [phaseSettingsInteraction]
            }
            let phaseSettingsConfig = {
                entryLabel: function(entry){
                    return entry.label;
                }
            }
            let phaseSettingsList = new InteractiveList({element: container, config: phaseSettingsConfig}, phaseSettingsData);
            phaseSettingsList.render();
        })



        // const sceneInputs = document.querySelectorAll(".alert-scene--input");
        //
        // sceneInputs.forEach(sceneInput => {
        //     const entitySelectButton = document.querySelector(".alert-scene-entititySelect--"+sceneInput.dataset.state);
        //     entitySelectButton.addEventListener("click", function(){
        //         const container = document.getElementById("entitySelect-dialog");
        //         const entitySelect = new EntitySelectDialog({element: container}, {entities: entities});
        //         entitySelect.render()
        //             .then(()=>{
        //                 //create new observer
        //                 const entitySelectObserver = new ComponentObserver("confirmed", function(event, data){
        //                     console.log("EntitySelect finished:");
        //                     console.log(JSON.stringify(data));
        //                     sceneInput.value = data.entity;
        //                     $(sceneInput).change();
        //                 })
        //                 entitySelect.addObserver(entitySelectObserver)
        //                 entitySelect.open();
        //             })
        //     })
        // })
    }
})
