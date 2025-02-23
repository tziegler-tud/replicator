import Module from "../module.js"
import {MDCDialog} from "@material/dialog";
import {MDCTextField} from "@material/textfield";
import Dashboard from "../../classes/dashboard";


export default new Module({
    name: "EntitiyDetailsModule",
    init: function(){
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

        const editTitleButton = document.getElementById("dashboard-titleEdit-button");
        editTitleButton.addEventListener("click", function(){
            if(!dialog.isOpen) dialog.open();
        })

        function saveTitle(value){
            return new Promise(function(resolve, reject){
                const data = {
                    identifier: value,
                }
                $.ajax({
                    method: "PUT",
                    url: "/api/v1/entities/" + intentHandler.identifier,
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
