import Handlebars from "handlebars";
import {dateRangeString, transformDateTimeString} from "../utility.js";

let helpers = {}
helpers.transformDateString= function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).date);
};

helpers.transformDateTimeString= function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).dateTime);
};

helpers.transformTimeString= function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).time("hh:mm"));
};

helpers.transformDateTimeStringExtended= function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).dateTimeExtended);
};

helpers.transformDateStringExtended= function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).dateExtended);
};

helpers.dateRangeString= function(startDateString, endDateString) {
    return new Handlebars.SafeString(dateRangeString(startDateString, endDateString).dateTimeRange);
};

helpers.timeRangeString= function(startDateString, endDateString) {
    return new Handlebars.SafeString(dateRangeString(startDateString, endDateString).timeRange);
};
export default helpers;