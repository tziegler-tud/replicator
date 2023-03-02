import Module from "./module.js"
import {MDCTextField} from "@material/textfield";


export default new Module({
    name: "ClientModule",
    init: function(){


        const textField = new MDCTextField(document.querySelector('.mdc-text-field'));

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
                .done(()=>{

                })
                .fail((reason)=>{

                })
        })
    }
})
