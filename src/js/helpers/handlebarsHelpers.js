const Handlebars = require("handlebars");
import {transformDateTimeString, dateRangeString} from "./helpers";

Handlebars.registerHelper('hasRole', function(participant, roleString) {
    return participant.role === roleString;
});

Handlebars.registerHelper('nextItem', function (array, index, options) {
    return options.fn(array[index + 1]);
});
Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('transformDateString', function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).date);
});

Handlebars.registerHelper('transformDateTimeString', function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).dateTime);
});

Handlebars.registerHelper('transformTimeString', function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).time("hh:mm"));
});

Handlebars.registerHelper('transformDateTimeStringExtended', function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).dateTimeExtended);
});

Handlebars.registerHelper('transformDateStringExtended', function(dateString, format) {
    return new Handlebars.SafeString(transformDateTimeString(dateString, format).dateExtended);
});

Handlebars.registerHelper('dateRangeString', function(startDateString, endDateString) {
    return new Handlebars.SafeString(dateRangeString(startDateString, endDateString).dateTimeRange);
});

Handlebars.registerHelper('timeRangeString', function(startDateString, endDateString) {
    return new Handlebars.SafeString(dateRangeString(startDateString, endDateString).timeRange);
});

Handlebars.registerHelper('checklength', function (v1, v2, options) {
    'use strict';
    if (v1.length>v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});


Handlebars.registerHelper('stringNotEmpty', function (v1, options) {
    'use strict';
    if(typeof(v1) !== "string") return options.inverse(this);
    if (v1.length>0) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('arrayNotEmpty', function (v1, options) {
    'use strict';
    if (!Array.isArray(v1)) return options.inverse(this)
    if (v1.length>0) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('greaterThan', function (v1, v2, options) {
    'use strict';
    if (v1>v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});


Handlebars.registerHelper('add', function (x, y) {
    return x+y;
});


Handlebars.registerHelper('timeFromNow', function (x) {
    return Date.now() + x;
});

Handlebars.registerHelper('userHasRole', function (user, role) {
    //handle populated and non-populated cases

    if (user.role === undefined) return false;
    let userRoleId = (user.role.id === undefined) ? user.role : user.role.id;
    let roleId = (role.id === undefined) ? role : role.id;
    return (userRoleId === roleId);
});

Handlebars.registerHelper('not', function (v1) {
    return !v1;
});

Handlebars.registerHelper('and', function (v1, v2, options) {
    'use strict';
    if (v1 && v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('localAnd', function (v1, v2) {
    'use strict';
    return v1 && v2;
});

Handlebars.registerHelper('localOr', function (v1, v2) {
    'use strict';
    return v1 || v2;
});


Handlebars.registerHelper('or', function (v1, v2, options) {
    'use strict';
    if (v1 || v2) {
        return options.fn(this);
    }
    return options.inverse(this);
});

Handlebars.registerHelper('HtmlFromTemplate', function (template, vars, log, options) {
    //find vars
    let htmlString = template;
    if(vars === undefined){
        vars = {};
    }
    Object.keys(vars).forEach(function(key){
        let name = key;
        let type = vars[key].type;
        let value = vars[key].value;
        let ref = vars[key].ref;
        //find name with $-prefix
        let htmlSnippet = "";
        if(ref){
            htmlSnippet = "<a href='"+ createRef(ref, type) + "' class='inline-link hb-templater hb-templater-link hb-templater--"+type + "' " + addRef(ref) + ">"+ value + "</a>";
        }
        else  htmlSnippet = "<span class='hb-templater hb-templater--"+type + "'> " + value + "</span>";
        let regex = new RegExp("\\$" + name + "\\b", "g");
        htmlString = htmlString.replace(regex, htmlSnippet);
    })
    function addRef(ref){
        if(ref) {
            return "data-ref='" + ref + "'";
        }
        else return "";
    }
    function createRef(ref, type){
        if(!ref) return "";
        let refUrl = "";
        switch(type){
            case "USER":
                refUrl = "/unisams/user/" + ref;
                break;
            case "EVENT":
                refUrl = "/unisams/events/" + ref;
                break;
            case "GROUP":
            default:
                break;
        }
        return refUrl;
    }
    return new Handlebars.SafeString(htmlString);
});

Handlebars.registerHelper("limitedEach", function(context, limit, options) {
    var ret = "";
    var limitIndex = Math.min(context.length, limit);
    for (var i = 0, j = limitIndex; i < j; i++) {
        ret = ret + options.fn(context[i]);
    }

    return ret;
});


// Legacy dateTime transformer for comparison, in case anything goes wrong
//
// Handlebars.registerHelper('transformDateString', function(dateString, format) {
//     format = (format === undefined || typeof(format) !== "string") ? "text" : format;
//     var myDate = new Date(dateString);
//     var month = (myDate.getMonth()+ 1).toString().length < 2 ? "0"+(myDate.getMonth()+ 1).toString() : (myDate.getMonth()+ 1).toString();
//     var day = myDate.getDate().toString().length < 2 ? "0"+myDate.getDate().toString() : myDate.getDate().toString();
//     var date;
//
//     if (format === "input") {
//         date = myDate.getFullYear() + "-" + month + "-" + day;
//     }
//     else {
//         date = day + "." + month + "." + myDate.getFullYear();
//     }
//     return new Handlebars.SafeString(date);
// });
//
// Handlebars.registerHelper('transformDateTimeString', function(dateString, format) {
//     format = (format === undefined || typeof(format !== "String")) ? "text" : format;
//     var myDate = new Date(dateString);
//     var month = (myDate.getMonth()+ 1).toString().length < 2 ? "0"+(myDate.getMonth()+ 1).toString() : (myDate.getMonth()+ 1).toString();
//     var day = myDate.getDate().toString().length < 2 ? "0"+myDate.getDate().toString() : myDate.getDate().toString();
//
//     var hours = myDate.getHours().toString().length < 2 ? "0"+myDate.getHours().toString() : myDate.getHours().toString();
//     var minutes = myDate.getMinutes().toString().length < 2 ? "0"+myDate.getMinutes().toString() : myDate.getMinutes().toString();
//     var date =  day + "." + month + "." + myDate.getFullYear() + " " + hours + ":" + minutes;
//
//     return new Handlebars.SafeString(date);
// });