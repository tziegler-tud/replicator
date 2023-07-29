import Module from "./module.js"
import {MDCTextField} from "@material/textfield";


export default new Module({
    name: "ClientModule",
    init: function(){

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
    }
})
