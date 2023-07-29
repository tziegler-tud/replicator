import Module from "./module.js"


export default new Module({
    name: "EntitiesModule",
    init: function(){
        $(".light-card").click(function(){
            window.location.href= "/entities/lights/" + this.dataset.id;
        })
        $(".group-card").click(function(){
            window.location.href= "/entities/groups/" + this.dataset.id;
        })
        $(".scene-card").click(function(){
            window.location.href= "/entities/scenes/" + this.dataset.id;
        })
    }
})
