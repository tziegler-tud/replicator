import {MDCList} from "@material/list";
import {MDCDrawer} from "@material/drawer";
import {MDCTopAppBar} from "@material/top-app-bar";
import "../scss/index.scss";
import "../scss/nav.scss";
import {MDCRipple} from "@material/ripple";

import ModuleLoader from "./moduleLoader.js";
import Navigation from "./navigation.js"

window.addEventListener('DOMContentLoaded', (event) => {
    const nav = new Navigation(window.page.nav);
    const moduleLoader = new ModuleLoader();

    //load modules from window.page.modules
    const modules = window.page.modules
    if(Array.isArray(modules)) {
        modules.forEach(module => {
            moduleLoader.load({
                moduleName: module,
                args: window.page,
            })
        })
    }

    const buttonRipple = new MDCRipple(document.querySelector('.mdc-button'));
});