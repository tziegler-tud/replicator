import IntentHandler from "./intentHandler.js";



var ignore = []


const h1 = new IntentHandler();
h1.setHandlerFunction(function(variables, location, handler){
    return true
})
ignore.push(h1);


export default ignore;

