import Module from "./module.js"


export default new Module({
    name: "IntentModule",
    init: function(){
        $(".intent-card").click(function(){
            window.location.href= "/intents/" + this.dataset.id;
        })
    }
})
