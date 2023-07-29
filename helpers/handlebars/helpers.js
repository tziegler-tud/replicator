import date from "./dates.js";

let helpers = {}
helpers = Object.assign(date, helpers);

helpers.nextItem= function (array, index, options) {
    return options.fn(array[index + 1]);
};
helpers.ifEquals= function(arg1, arg2, options) {
    return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
};

helpers.checklength= function (v1, v2, options) {
    'use strict';
    if (v1.length>v2) {
        return options.fn(this);
    }
    return options.inverse(this);
};


helpers.stringNotEmpty= function (v1, options) {
    'use strict';
    if(typeof(v1) !== "string") return options.inverse(this);
    if (v1.length>0) {
        return options.fn(this);
    }
    return options.inverse(this);
};

helpers.arrayNotEmpty= function (v1, options) {
    'use strict';
    if (!Array.isArray(v1)) return options.inverse(this)
    if (v1.length>0) {
        return options.fn(this);
    }
    return options.inverse(this);
};

helpers.greaterThan= function (v1, v2, options) {
    'use strict';
    if (v1>v2) {
        return options.fn(this);
    }
    return options.inverse(this);
};


helpers.add= function (x, y) {
    return x+y;
};


helpers.timeFromNow= function (x) {
    return Date.now() + x;
};

helpers.not= function (v1) {
    return !v1;
};

helpers.and= function (v1, v2, options) {
    'use strict';
    if (v1 && v2) {
        return options.fn(this);
    }
    return options.inverse(this);
};

helpers.localAnd= function (v1, v2) {
    'use strict';
    return v1 && v2;
};

helpers.localOr= function (v1, v2) {
    'use strict';
    return v1 || v2;
};


helpers.or= function (v1, v2, options) {
    'use strict';
    if (v1 || v2) {
        return options.fn(this);
    }
    return options.inverse(this);
};

helpers.limitedEach = function(context, limit, options) {
    var ret = "";
    var limitIndex = Math.min(context.length, limit);
    for (var i = 0, j = limitIndex; i < j; i++) {
        ret = ret + options.fn(context[i]);
    }

    return ret;
};

helpers.json = function(context) {
    return JSON.stringify(context);
};

/**
 * returns the key names of an object as a string seperated by comma
 * @param object
 * @returns {string}
 */
helpers.keysToString = function(object) {
    let s = "";
    for (const key in object){
        s = s+key + ", ";
    }
    if(s.length > 0) {
        s = s.slice(0, -2)
    }
    return s;
};

helpers.switch = function(value, options) {
    this.switch_value = value;
    return options.fn(this);
};

helpers.case = function(value, options) {
    if (value === this.switch_value) {
        return options.fn(this);
    }
};


export default helpers;
