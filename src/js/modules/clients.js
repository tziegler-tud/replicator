import Module from "./module.js"
import {MDCTextField} from "@material/textfield";
import Dashboard from "../classes/dashboard";
import InteractiveList from "../components/interactiveList";
import ComponentObserver from "../helpers/componentObserver";


export default new Module({
    name: "ClientModule",
    init: function(){

        const dashboardContainer = document.getElementById("dashboard-container");
        let dashboard = dashboardContainer ? new Dashboard({container: dashboardContainer, tabs: true}) : undefined;

        try {
            const textField = new MDCTextField(document.querySelector('.mdc-text-field'));
        }
        catch(e){
            console.log("Failed to initialize TextFields.")
        }
        $(".discoverClientButton").click(function(){
            //get associated value
            const input = document.getElementById("discoverClient-url");
            const url = input.value;
            const data = {
                url: url,
            }
            $.ajax({
                type: "POST",
                url: "/api/v1/clients/discover",
                data: data,
            })
                .done((response)=>{
                    //Successfull
                    console.log(response);
                    window.location.href= "/clients/" + response.clientId;
                })
                .fail((reason)=>{
                    console.error(reason);
                })
        })

        $(".client-card").click(function(){
            window.location.href= "/clients/" + this.dataset.id;
        })

        $(".dashboard-delete-button").click(function(){
            const clientId = $(this).data("id");
            if(!clientId) {
                console.error("Failed to remove client: Invalid id given")
            }
            removeById(clientId);
        });

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
    }
})
