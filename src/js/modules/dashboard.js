import Module from "./module.js"
import AmountRenderer from "../components/amountRenderer";
import "../../scss/dashboard.scss";

export default new Module({
    name: "DashboardModule",
    init: function(pageData){
        //retrieve page arguments


        //set up amountRenderer
        $(".amount-renderer").each(function(index, element){
            const component = new AmountRenderer({element: element});
            component.setValues({total: pageData.clients.stats.total, amount: pageData.clients.stats.connected})
            component.render();
        })

        //get dashboard container
        const dashboardContainer =
        //check if tab dashboard
        document.getElementById()
    }
})
