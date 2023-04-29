import Module from "../module.js"


export default new Module({
    name: "IntentHandlerModule",
    init: function(){
        $(".intentHandler-card").click(function(){
            window.location.href= "/intenthandlers/edit/" + this.dataset.id;
        })

        $(".add-intentHandler-card").click(function(){
            window.location.href= "/intenthandlers/add?intent=" + this.dataset.intent;
        })


    }
})
