let defaults = {
    headers: {},
    baseUrl: null,
    interceptors: []
}


class ModelManager {
    constructor(model) {
        this.model = model
    }

    get(pk, extras) {
        var url = this.model.baseUrl + 'get/' + pk + '/';
        // extras are optional
        if (extras) {
            url += '?' + this._parseGetParams(extras);
        }
        return this._fetch('GET', url);
    }

    filter(filters, excludes) {
        var url = this.model.baseUrl + 'filter/';
        var filterArgs = this._parseGetParams(filters);
        if (filterArgs !== '') {
            url += '?' + filterArgs;
        }
        // exclude is optional
        if (excludes) {
            if (filterArgs === '') {
                url += '?';
            }   else {
                url += '&';
            }
            url += this._parseGetParams(excludes);
        }
        return this._fetch('GET', url);
    }

    form_dict(filter) {
        var url = this.model.baseUrl + 'form-info/';
        if (filter) {
            if (typeof filter !== 'object') {
                filter = {'pk': filter};
            }
            var filterArgs = this._parseGetParams(filter);
            if (filterArgs !== '') {
                url += '?' + filterArgs;
            }
        }
        return this._fetch('GET', url);
    }

    create(formdata, extras) {
        var url = this.model.baseUrl + 'create/';
        // extras are optional
        if (extras) {
            url += '?' + this._parseGetParams(extras);
        }
        return this._fetch('POST', url, formdata);
    }

    update(filter, formdata, extras) {
        if (typeof filter !== 'object') {
            filter = {'pk': filter};
        }
        var url = this.model.baseUrl + 'update/';
        var filterArgs = this._parseGetParams(filter);
        if (filterArgs !== '') {
            url += '?' + filterArgs;
        }
        // extras are optional
        if (extras) {
            if (filterArgs === '') {
                url += '?';
            }   else {
                url += '&';
            }
            url += this._parseGetParams(extras);
        }
        return this._fetch('POST', url, formdata);
    }

    delete(filter, extras) {
        if (typeof filter !== 'object') {
            filter = {'pk': filter};
        }
        var url = this.model.baseUrl + 'delete/';
        var filterArgs = this._parseGetParams(filter);
        if (filterArgs !== '') {
            url += '?' + filterArgs;
        }
        // extras are optional
        if (extras) {
            if (filterArgs === '') {
                url += '?';
            }   else {
                url += '&';
            }
            url += this._parseGetParams(extras);
        }
        return this._fetch('POST', url);
    }

    _fetch(method, url, data) {
        var _this = this;
        var xhr = null;
        var promise = new Promise(function(resolve, reject) {
            var req = new XMLHttpRequest();
            xhr = req;
            url = defaults.baseUrl ? defaults.baseUrl + url : url;
            req.open(method, url, true);
            req.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            if (method === 'POST') {
                req.setRequestHeader('X-CSRFToken', _this._getCSRFToken());
            }
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
                    if ((req.status === 200 || req.status === 201) &&
                        typeof resolve === 'function') {
                        for (let interceptor of defaults.interceptors) {
                            interceptor(JSON.parse(req.responseText));
                        }
                        _this.model.callback(resolve)(JSON.parse(req.responseText).data);
                    } else if (req.status === 403 &&
                        typeof reject === 'function') {
                        for (let interceptor of defaults.interceptors) {
                            try {
                                interceptor(JSON.parse(req.responseText));
                            } catch(err) {
                                interceptor(req.responseText)
                            }
                        }
                        reject(req);
                    } else if (req.status !== 200 &&
                        typeof reject === 'function') {
                        reject(req);
                    }
                }
            };
            if (data && !(Object.prototype.toString.call(data) === '[object FormData]')) {
                var param = data;
                data = new FormData();
                for (var key in param) {
                    data.append(key, param[key]);
                }
            }
            req.send(data ? data : null);
        });
        promise.xhr = xhr;
        return promise;
    }

    _parseGetParams(extras) {
        var exs = [];
        for (var key in extras) {
            if(extras.hasOwnProperty(key)) {
                exs.push(key + '=' + encodeURIComponent(extras[key]));
            }
        }
        return exs.join('&');
    }

    _getCSRFToken() {
        var pattern = new RegExp('(?:(?:^|.*;)\\s*'
            + encodeURIComponent('csrftoken').replace(/[\-\.\+\*]/g, '\\$&')
            + '\\s*\\=\\s*([^;]*).*$)|^.*$');
        var value = decodeURIComponent(
            document.cookie.replace(pattern, '$1'));
        return value || null;
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
        this.baseUrl = '/api-sileo/v3/' + namespace + '/' + resource + '/';
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
    Model: Model,
    ModelManager: ModelManager,
    defaults: defaults
};
