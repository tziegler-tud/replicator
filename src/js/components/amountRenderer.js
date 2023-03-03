import Component from "./Component.js"
import "../../scss/components/amountRenderer.scss";

export default class AmountRenderer extends Component{
    constructor({element, config={}}={}, values={total: 0, amount: 0}) {
        super({name: "amountRenderer", element: element, config: config})
        this.templateUrl = "/js/components/templates/amountRenderer.hbs";
        this.data = {
            total: values.total,
            amount: values.amount,
        };
    }

    setValues(values){
        this.data = {
            total: values.total,
            amount: values.amount,
        };
    }

    setTotal(value){
        this.data.total = value;
    }

    setAmount(value){
        this.data.amount = value;
    }


}