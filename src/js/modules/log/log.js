import Module from "../module.js"
import {MDCTextField} from "@material/textfield";
import {MDCList} from '@material/list';
import Snackbar from "../../helpers/snackbar";


export default new Module({
    name: "LogModule",
    init: function(){
        const snackbar = new Snackbar();

        try {
            const list = new MDCList(document.querySelector('.log-list'));
        }
        catch(e){
            console.log("Failed to initialize TextFields.")
        }
    }
})
