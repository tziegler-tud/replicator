import {MDCDrawer} from "@material/drawer";
import {MDCTopAppBar} from "@material/top-app-bar";
import {MDCRipple} from "@material/ripple";

export default class Navigation{
    constructor({currentEntry, topbar="replicator-topbar", drawer="replicator-sidenav", navEntryNamespace="nav-entry"}){
        this.currentEntryName = currentEntry;
        this.currentEntry = undefined;
        this.navEntryNamespace = navEntryNamespace;
        this.topbarId = topbar;
        this.drawerId = drawer;
        this.topbarContainer = document.getElementById(topbar);
        this.drawerContainer = document.getElementById(drawer);
        this.entries = $(this.drawerContainer).find("." + navEntryNamespace);
        this.activeElementClassName = "mdc-deprecated-list-item--activated";
        this.init()
    }

    init() {

        const drawer = MDCDrawer.attachTo(this.drawerContainer);
        this.drawer = drawer;
        const topAppBar = MDCTopAppBar.attachTo(this.topbarContainer);
        topAppBar.setScrollTarget(document.getElementById('main-content'));
        topAppBar.listen('MDCTopAppBar:nav', () => {
            drawer.open = !drawer.open;
        });
        this.topAppBar = topAppBar;

        const selector = '.mdc-button, .mdc-icon-button, .mdc-card__primary-action';
        const ripples = [].map.call(document.querySelectorAll(selector), function (el) {
            return new MDCRipple(el);
        });

        //set current nav entry
        this.setActive(this.currentEntryName);

    }

    setActive(currentEntry){
        let entryId = this.navEntryNamespace + "--"+ currentEntry;
        let container = $(this.drawerContainer).find("#"+entryId)[0];
        this.entries.each((index, element) => {
            element.classList.remove(this.activeElementClassName);
        })
        container.classList.add(this.activeElementClassName);
        this.currentEntryName = currentEntry;
        this.currentEntry = container;
    }
};