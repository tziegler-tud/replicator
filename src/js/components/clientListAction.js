import Component from "./Component.js"
import "../../scss/components/clientListAction.scss";

export default class ClientListAction extends Component{
    constructor({element, config={}}={}, data={header: "", body: ""}) {
        super({name: "card", element: element, config: config, data: data})
        this.templateUrl = "/js/components/templates/card.hbs";
    }

    setHeader(htmlContent){
        this.data.header = htmlContent;
    }

    setBody(htmlContent){
        this.data.body = htmlContent;
    }
}