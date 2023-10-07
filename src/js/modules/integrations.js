import Module from "./module.js"
import {MDCTextField} from "@material/textfield";
import Snackbar from "../helpers/snackbar";


export default new Module({
    name: "IntegrationsModule",
    init: function(){
        const snackbar = new Snackbar();

        const identifier = window.integration ? window.integration.uniqueName : undefined;

        if(window.page.reload) successfulReloadMessage();


        $(".client-card").click(function(){
            window.location.href= "/integrations/" + this.dataset.name;
        })

        $(".dashboard-refresh-button").click(function(){
            const identifier = $(this).data("id");
            reload(identifier);
        });

        function reload(identifier){
            const data = {
            }

            $.ajax({
                method: "POST",
                url: "/api/v1/integrations/" + identifier + "/reload",
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
            .done(result => {
                location.href = "/integrations/" + identifier + "?reload=true";
            })
            .fail((jqxhr, textStatus, errorThrown) => {
                snackbar.showError(jqxhr, textStatus, errorThrown);
            })
        }

        function successfulReloadMessage(){
            snackbar.show("Integration reloaded successfully.")
        }
    }
})
