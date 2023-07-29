import {MDCTabBar} from '@material/tab-bar';

export default class Dashboard {
    constructor({container, tabs= false}={}) {
        this.errorMessage = "Failed to initialize Dashboard: ";
        this.hasTabs = tabs;
        this.container = container;


        if(this.container === undefined) {
            console.error(this.errorMessage + "Container element not found.");
        }
        this.container = container;
        if(!this.container.classList.contains("dashboard-container")){
            console.error(this.errorMessage + "Invalid container element.")
        }
        if(tabs){

            this.initTabs()
        }
        else {
            this.initSingle()
        }


    }

    initSingle(){
        console.log("Initializing dashboard...");
    }

    initTabs(){
        let self = this;
        console.log("Initializing tab dashboard...");
        this.tabs = [];
        //get tabs container
        const tabBar = new MDCTabBar(document.querySelector('.mdc-tab-bar'));
        //get tab containers
        const tabContainers = $(".dashboard-tab");
        $(tabContainers).each((i, tabContainer) => {
            const index = tabContainer.dataset.tabid;
            const tab = new Tab({id: parseInt(index), contentContainer: tabContainer});
            self.tabs.push(tab);
        })

        tabBar.listen("MDCTabBar:activated", function(event){
            const index = event.detail.index;
            self.activateTabByIndex(index);
        })


    }
    deactivateAll(){
        this.tabs.forEach(tab => {
            tab.deactivate();
        })
    }

    getTabByIndex(index){
        return this.tabs.find(tab => tab.id === index);
    }

    activateTabByIndex(index){
        const tab = this.getTabByIndex(index);
        if(tab){
            this.deactivateAll();
            tab.activate();
        }
        else {
            console.error(self.errorMessage + "Tab index missmatch.")
        }
    }
}

class Tab{
    constructor({id, contentContainer}){
        this.active = false;
        this.id = id;
        this.contentContainer = contentContainer;

        if(this.contentContainer.classList.contains("dashboard-tab--active")){
            this.active = true;
        }
    }

    activate(){
        this.contentContainer.classList.add("dashboard-tab--active");
        this.active = true;
    }
    deactivate(){
        this.contentContainer.classList.remove("dashboard-tab--active");
        this.active = false;
    }
}