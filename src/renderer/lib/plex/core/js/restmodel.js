let defaults = {
    baseUrl: null,
    headers: {},
    interceptors: []
};



class Django {
    constructor() {
        console.info('Initialized Django module.');
    }
}

class ModelManager {
    constructor(model) {
        this.model = model;
    }

    get(pk, successCallback, errorCallback, extras) {
        if (arguments.length > 1 && typeof arguments[1] !== 'function') {
            throw new Error('Only one primary key is allowed.');
        }

        if (typeof errorCallback === 'object' &&
        typeof extras === 'undefined') {
            extras = errorCallback;
            errorCallback = null;
        }

        var url = this.model.baseUrl + 'get/' + pk + '/';
        // extras are optional
        if (typeof extras === 'object') {
            url += '?' + this._parseGetParams(extras);
        }
        return this._fetch(
            'GET', url, this.model.callback(successCallback),
            errorCallback);
    }

    slice(start, end, successCallback, errorCallback, extras) {
        if (arguments.length > 2 && typeof arguments[2] !== 'function') {
            throw new Error('Only two primary keys are allowed.');
        }

        if (typeof errorCallback === 'object' &&
        typeof extras === 'undefined') {
            extras = errorCallback;
            errorCallback = null;
        }
        var url = this.model.baseUrl + 'slice/' + start + '/' + end + '/';
        // extras are optional
        if (typeof extras === 'object') {
            url += '?' + this._parseGetParams(extras);
        }
        return this._fetch(
            'GET', url, this.model.callback(successCallback),
            errorCallback);
    }

    filter(filter, successCallback, errorCallback, extras) {
        if (typeof errorCallback === 'object' &&
        typeof extras === 'undefined') {
            extras = errorCallback;
            errorCallback = null;
        }
        var url = this.model.baseUrl + 'filter/';
        var filterArgs = this._parseGetParams(filter);
        if (filterArgs !== '') {
            url += '?' + filterArgs;
        }
        // extras are optional
        if (typeof extras === 'object') {
            if (filterArgs === '') {
                url += '?';
            }   else {
                url += '&';
            }
            url += this._parseGetParams(extras);
        }
        return this._fetch(
            'GET', url, this.model.callback(successCallback),
            errorCallback);
    }

    _fetch(method, url, successCallback, errorCallback) {
        $('#results').find('.url').html(url);
        var req = new XMLHttpRequest();
        url = defaults.baseUrl ? defaults.baseUrl + url : url;
        req.open(method, url, true);
        for (var key in defaults.headers) {
            var value = defaults.headers[key];
            if (typeof value === 'function') {
                req.setRequestHeader(key, value());
            } else if (value) {
                req.setRequestHeader(key, value);
            }
        }
        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                if (req.status === 200 &&
                typeof successCallback === 'function') {
                    for (let interceptor of defaults.interceptors) {
                        interceptor(JSON.parse(req.responseText));
                    }
                    successCallback(JSON.parse(req.responseText).object);
                } else if (req.status === 403 &&
                typeof errorCallback === 'function') {
                    for (let interceptor of defaults.interceptors) {
                        interceptor(JSON.parse(req.responseText));
                    }
                    errorCallback(req);
                } else if (req.status !== 200 &&
                typeof errorCallback === 'function') {
                    errorCallback(req);
                }
            }
        };
        req.send();
        return req;
    }

    _parseGetParams(extras) {
        var exs = [];
        for (var key in extras) {
            if(extras.hasOwnProperty(key)) {
                exs.push(key + '=' + extras[key]);
            }
        }
        return exs.join('&');
    }
}


var utils = {
    extend: function(base) {
        Array.prototype.slice.call(arguments, 1).forEach(function(ext) {
            for (var key in ext) {
                if (ext.hasOwnProperty(key)) {
                    base[key] = ext[key];
                }
            }
        });
        return base;
    },

    flow: function(data, callbacks) {
        return callbacks.reduce(function(data, callback) {
            if (data instanceof Array) {
                return data.map(callback);
            }
            return callback(data);
        }, data);
    }
};

var defaultOptions = { applyGlobalMiddlewares: true };
var globalMiddlewares = [];

class Model {
    constructor(namespace, resource, middlewares, options) {
        this.baseUrl = '/api/v3' + namespace + '/' + resource + '/';
        this.middlewares = middlewares || [];
        this.options = utils.extend({}, defaultOptions, options);
        this.objects = new ModelManager(this);
    }

    callback(callback) {
        var model = this;
        return function(response) {
            if (model.options.applyGlobalMiddlewares) {
                response = utils.flow(response, globalMiddlewares);
            }
            response = utils.flow(response, model.middlewares);
            window.wrapErrors(callback)(response);
        };
    }
};

Model.addGlobalMiddleware = function() {
    Array.prototype.forEach.call(arguments, function(middleware) {
        if (typeof middleware === 'function') {
            globalMiddlewares.push(middleware);
        }
    });
};

// wrapper function to log errors in async functions
function wrapErrors(fn) {
    // don't wrap function more than once
    if (!fn.__wrapped__) {
        fn.__wrapped__ = function () {
            try {
                return fn.apply(this, arguments);
            } catch (e) {
                window.onerror(e);
                throw e; // re-throw the error
            }
        };
    }
    return fn.__wrapped__;
}

window.wrapErrors = window.wrapErrors || wrapErrors;



export default {
    Django: Django,
    Model: Model,
    ModelManager: ModelManager,
    defaults: defaults
};
