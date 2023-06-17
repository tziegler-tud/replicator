import Module from "../module.js"
import LinesPreview from "../../components/linesPreview.js";
import InteractiveList from "../../components/interactiveList.js";
import Dashboard from "../../classes/dashboard.js";
import ComponentObserver from "../../helpers/componentObserver.js";
import Snackbar from "../../helpers/snackbar";

import {MDCDialog} from '@material/dialog';
import {MDCTextField} from '@material/textfield';
import SkillSelectDialog from "../../components/skillSelectDialog";




export default new Module({
    name: "IntentHandlerDetailsModule",
    init: function(){

        let self = this;

        const snackbar = new Snackbar();

        let hasChanged = false;

        function changed(force=false) {
            if (hasChanged || force) return true;
            hasChanged = true;
            //enable save button
            enableSaveButton();
        }


        const dialog = new MDCDialog(document.getElementById("dialog-save"));
        const textField = new MDCTextField(document.querySelector('.mdc-text-field'));
        dialog.listen("MDCDialog:closed", (event) => {
            if(event.detail.action === "save"){
                const val = document.getElementById("dialog-save-input").value;
                saveTitle(val)
                    .then(result => {
                        location.reload();
                    })
            }
        })

        const dashboardContainer = document.getElementById("dashboard-container");
        let dashboard = new Dashboard({container: dashboardContainer, tabs: true});

        const intentHandler = window.page.intentHandler;
        const skills = window.page.skills;

        const saveButton = document.getElementById("dashboard-save-button");
        saveButton.addEventListener("click", function(){
            save();
        })

        const removeButton = document.getElementById("dashboard-delete-button");
        removeButton.addEventListener("click", function(){
            remove();
        })

        const editTitleButton = document.getElementById("dashboard-titleEdit-button");
        editTitleButton.addEventListener("click", function(){
            if(!dialog.isOpen) dialog.open();
        })



        //clients interactive list
        const clients = window.page.clients;
        const clientsContainer = document.getElementById("clientsList");
        const clientSwitch = {
            type: "switch",
            identifier: "switch-client-enabled",
            valueFunc: function(entry){
                return (intentHandler.clients.findIndex(client => client.identifier === entry.identifier) > -1);
            }
        }
        let clientsData = {
            listEntries: clients,
            interactions: [clientSwitch]
        }
        let clientsConfig = {
            entryLabel: function(entry){
                return entry.identifier;
            }
        }
        let interactiveClientList = new InteractiveList({element: clientsContainer, config: clientsConfig}, clientsData);
        interactiveClientList.render();

        const clientListObserver = new ComponentObserver("all", function(event, data){
            changed();
        })
        interactiveClientList.addObserver(clientListObserver)

        let variablesBySelected = {
            required: [],
            optional: [],
            forbidden: [],
        }

        const variables = intentHandler.variables;
        const variablesWithTypes = {};
        const initialAssignment = {};
        Object.keys(variables).forEach(key=> {
          Object.keys(variables[key]).forEach(variableKey => {
              variablesWithTypes[variableKey] = variables[key][variableKey];
              initialAssignment[variableKey] = key;
              variablesBySelected[key].push(variableKey)
          })
        })



        const variableSelects = $(".variable-select");
        variableSelects.change(function(){
            updateVariables();
            updatePreviewComponent();
        })

        //update selected options to match initial assignment
        variableSelects.each((index, select) => {
            const variable = select.dataset.variable;
            select.value = initialAssignment[variable];
        })

        const linesPreviewContainer = document.getElementById("intentHandler-linesPreview");
        const linesPreviewComponent = new LinesPreview({
            element: linesPreviewContainer,
            data: {
                lines: intentHandler.intent._lines,
                variables: variablesBySelected,
            }

        })
        linesPreviewComponent.render();

        function updateVariables(){
            variablesBySelected = {
                required: [],
                optional: [],
                forbidden: [],
            }
            variableSelects.each(function(){
                const variable = this.dataset.variable;
                const selected = this.value;
                variablesBySelected[selected].push(variable);
            })
        }

        function updatePreviewComponent(){
            linesPreviewComponent.data.variables = variablesBySelected;
            linesPreviewComponent.data.initialAssignment = variablesBySelected;
            linesPreviewComponent.render();
        }

        //actions
        $(".dashboard-action-item").on("click", function(event){
            window.location.href = "/intenthandlers/edit/"+ intentHandler.id + "/action/"+this.dataset.actionid;
        })

        $(".button-addAction").on("click", function(){
            //skillSelect component
            const skillSelectContainer = document.getElementById("skillSelect-dialog");
            const skillSelect = new SkillSelectDialog({element: skillSelectContainer}, {skills: skills});
            skillSelect.render()
                .then(()=>{
                    //create new observer
                    const skillSelectObserver = new ComponentObserver("confirmed", function(event, data){
                        addAction(data.skill);
                    })
                    skillSelect.addObserver(skillSelectObserver)
                    skillSelect.open();
                })


        })

        function addAction(skillIdentifier){
            let data = {
                skill: {
                    identifier: skillIdentifier
                }
            }
            $.ajax({
                method: "POST",
                url: "/api/v1/intentHandler/" + intentHandler.identifier + "/addAction",
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    window.location.href = "/intenthandlers/edit/"+ intentHandler.id + "/action/"+result._id;
                })
        }

        function enableSaveButton(){

        }

        function remove(){
            const data = {
            }

            $.ajax({
                method: "DELETE",
                url: "/api/v1/intentHandler/" + intentHandler.identifier,
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    window.location.href= "/intenthandlers";
                })
        }

        function save(){
            //get enabled clients from component
            const clientListResults = interactiveClientList.getEntries();
            const enabledClients  = [];
            clientListResults.forEach(entry => {
                const enabledInteraction = entry.interactions.find(interaction => interaction.identifier === "switch-client-enabled");
                if(enabledInteraction.getValue()){
                    //find client
                    const client = clients.find(client => client.identifier === entry.listEntry.identifier)
                    if(client) enabledClients.push(client.clientId);
                }
            })

            const variables = {forbidden: {}, optional: {}, required: {}}
            variablesBySelected.forbidden.forEach(variable => {
                variables.forbidden[variable] = variablesWithTypes[variable];
            })
            variablesBySelected.optional.forEach(variable => {
                variables.optional[variable] = variablesWithTypes[variable];
            })
            variablesBySelected.required.forEach(variable => {
                // variables.required[variable] = variablesWithTypes[variable];
                variables.required[variable] = variablesWithTypes[variable];
            })

            const data = {
                clients: enabledClients,
                variables: variables,
            }

            $.ajax({
                method: "PUT",
                url: "/api/v1/intentHandler/" + intentHandler.identifier,
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    snackbar.show("IntentHandler saved successfully.")
                })
        }

        function saveTitle(value){
            return new Promise(function(resolve, reject){
                const data = {
                    identifier: value,
                }
                $.ajax({
                    method: "PUT",
                    url: "/api/v1/intentHandler/" + intentHandler.identifier,
                    data: JSON.stringify(data),
                    contentType: "application/json; charset=UTF-8",
                    dataType: "json",
                })
                    .done(result => {
                        snackbar.show("Identifier saved successfully.");
                        resolve(result);
                    })
            })

        }

    }
})
