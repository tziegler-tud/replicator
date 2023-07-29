import Component from "./Component.js"
import "../../scss/components/card.scss";

export default class Card extends Component{
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