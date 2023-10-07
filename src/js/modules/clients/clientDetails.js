import Module from "../module.js"
import {MDCTextField} from "@material/textfield";
import Dashboard from "../../classes/dashboard";
import InteractiveList from "../../components/interactiveList";
import ComponentObserver from "../../helpers/componentObserver";
import Snackbar from "../../helpers/snackbar";

export default new Module({
    name: "ClientDetailsModule",
    init: function(){

        const client = window.page.client;
        const clientDetails = window.page.clientDetails;
        const deviceSettings = window.page.deviceSettings;
        const interfaceSettings = window.page.interfaces;

        const snackbar = new Snackbar();


        let hasChanged = false;


        function changed(force=false) {
            if (hasChanged || force) return true;
            hasChanged = true;
            //enable save button
            // enableSaveButton();
        }

        let recordingSettings = [];
        if(deviceSettings.recording) {
            recordingSettings = [
                {
                    label: "porcupine senisitivity",
                    key: "porcupineSensitivity",
                    value: deviceSettings.recording.porcupineSensitivity,
                },
                {
                    label: "rhino senisitivity",
                    key: "rhinoSensitivity",
                    value: deviceSettings.recording.rhinoSensitivity,
                },
                {
                    label: "Endpoint Duration (sec)",
                    key: "endpointDurationSec",
                    value: deviceSettings.recording.endpointDurationSec,
                }
            ]
        }



        const dashboardContainer = document.getElementById("dashboard-container");
        let dashboard = dashboardContainer ? new Dashboard({container: dashboardContainer, tabs: true}) : undefined;

        try {
            const textField = new MDCTextField(document.querySelector('.mdc-text-field'));
        }
        catch(e){
            console.log("Failed to initialize TextFields.")
        }

        $(".dashboard-delete-button").click(function(){
            const clientId = $(this).data("id");
            if(!clientId) {
                console.error("Failed to remove client: Invalid id given")
            }
            removeById(client.clientId);
        });

        $(".dashboard-save-button").click(function(){
            const clientId = $(this).data("id");
            if(!clientId) {
                console.error("Failed to remove client: Invalid id given")
            }
            saveSettings();
        });

        const recordingSettingsContainer = document.getElementById("recordingSettingsList");
        // const settingsSwitch = {
        //     type: "switch",
        //     identifier: "switch-client-enabled",
        //     valueFunc: function(entry){
        //         return (intentHandler.clients.findIndex(client => client.identifier === entry.identifier) > -1);
        //     }
        // }
        const recordingSettingsNumber = {
            type: "number",
            identifier: "input-settings-data",
            valueFunc: function(entry){
                return (entry.value);
            },
            params: {
                disabled: false,
                readonly: false,
                step: 0.1,
            }
        }
        let recordingSettingsData = {
            listEntries: recordingSettings,
            interactions: [recordingSettingsNumber]
        }
        let recordingSettingsConfig = {
            entryLabel: function(entry){
                return entry.label;
            }
        }
        let interactiveRecordingSettingsList = new InteractiveList({element: recordingSettingsContainer, config: recordingSettingsConfig}, recordingSettingsData);
        interactiveRecordingSettingsList.render();

        const recordingSettingsListObserver = new ComponentObserver("all", function(event, data){
            changed();
        })
        interactiveRecordingSettingsList.addObserver(recordingSettingsListObserver)

        const interfacesListContainer = document.getElementById("interfacesList");
        const interfacesSwitch = {
            type: "switch",
            identifier: "switch-client-enabled",
            valueFunc: function(entry){
                return entry.active;
            }
        }

        let interfacesData = {
            listEntries: interfaceSettings,
            interactions: [interfacesSwitch]
        }
        let interfacesConfig = {
            entryLabel: function(entry){
                return entry.type;
            }
        }
        let interfacesList = new InteractiveList({element: interfacesListContainer, config: interfacesConfig}, interfacesData);
        interfacesList.render();

        const interfacesListObserver = new ComponentObserver("all", function(event, data){
            //find type and state of changed if
            const type = data.interaction.listEntry.type;
            const state = data.value;

            setInterfaceState(type, state)
                .then(result => {
                    if(result.status === 200) {
                        snackbar.show(result.message)
                    }
                    else {
                        snackbar.showCustomError(result.message, result.status, result.error);
                    }
                })
                .catch(err => {
                    snackbar.showError(err);
                })
        })
        interfacesList.addObserver(interfacesListObserver)

        function saveSettings(){
            const entries = interactiveRecordingSettingsList.getEntries();
            const entryData = entries.map(entry => {
                return {
                    key: entry.listEntry.key,
                    value: entry.interactions[0].getValue()
                };
            })
            let data = {
                recording: {}
            }
            entryData.forEach(e => {
                data.recording[e.key] = e.value;
            })
            $.ajax({
                method: "POST",
                url: "/api/v1/clients/" + client.clientId + "/settings",
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    snackbar.show("On-Device settings updated successfully.")
                })
        }

        function removeById(id){
            const data = {
            }

            $.ajax({
                method: "DELETE",
                url: "/api/v1/clients/" + id,
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    window.location.href= "/clients";
                })
        }

        function setInterfaceState(type, state){
            const data = {
                type: type,
                state: state,
            }

            return $.ajax({
                method: "POST",
                url: "/api/v1/clients/" + client.clientId +"/interface",
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
        }
    }
})
