import Card from "./Card.js"
import "../../scss/components/card.scss";

export default class ClientCard extends Card {
    constructor({element, config={}}={}, data={header: "", body: ""}) {
        super({name: "clientCard", element: element, config: config, data: data});
        this.templateUrl = "/js/components/templates/clientCard.hbs";
        this.client = {};
    }

    setClient(client){
        this.client = client;
    }

    
}