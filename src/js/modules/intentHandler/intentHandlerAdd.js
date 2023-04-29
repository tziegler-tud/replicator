import Module from "../module.js"
import {MDCTextField} from "@material/textfield";


export default new Module({
    name: "IntentHandlerAddModule",
    init: function(){

        try {
            const textField = new MDCTextField(document.querySelector('.mdc-text-field'));
        }
        catch(e){
            console.log("Failed to initialize TextFields.")
        }

        const intentSelect = document.getElementById("intent-select");
        const identifierInput = document.getElementById("intentHandler-identifier");
        const addButton = document.getElementById("dashboard-add-button");
        addButton.addEventListener("click", function(){

            add(identifierInput.value, intentSelect.value);
        })

        function add(identifier, intent){
            const data = {
                identifier: identifier,
                intent: intent,
            }

            $.ajax({
                method: "POST",
                url: "/api/v1/intentHandler/",
                data: JSON.stringify(data),
                contentType: "application/json; charset=UTF-8",
                dataType: "json",
            })
                .done(result => {
                    window.location.href= "/intenthandlers/edit/"+result._id;
                })
        }
    }
})
