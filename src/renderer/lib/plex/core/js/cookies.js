(function (root, declaration) {
    if (typeof define === 'function' && define.amd) {
        define([], declaration);
    } else {
        root.cookies = declaration();
    }
})(this, function () {
    /*
     *  Derived from Mozilla's cookies library (https://developer.mozilla.org/
     *      en-US/docs/Web/API/document/cookie#A_little_framework_a_complete_
     *      cookies_readerwriter_with_full_unicode_support
     */
    var cookies = {
        getItem: function (key) {
            if (!key) {
                return null;
            }
            var pattern = new RegExp('(?:(?:^|.*;)\\s*' +
                encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') +
                '\\s*\\=\\s*([^;]*).*$)|^.*$');
            var value = decodeURIComponent(
                document.cookie.replace(pattern, '$1'));
            return value || null;
        },

        setItem: function (key, value, end, path, domain, secure) {
            var pattern = /^(?:expires|max\-age|path|domain|secure)$/i;
            if (!key || pattern.test(key)) {
                return false;
            }
            var expires = '';
            if (end) {
                switch (end.constructor) {
                case Number: {
                    expires = end === Infinity
                        ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT'
                        : '; max-age=' + end;
                    break;
                }
                case String: {
                    expires = '; expires=' + end;
                    break;
                }
                case Date: {
                    expires = '; expires=' + end.toUTCString();
                    break;
                }
                }
            }
            document.cookie = encodeURIComponent(key) + '=' +
                encodeURIComponent(value) + expires +
                (domain ? '; domain=' + domain : '') +
                (path ? '; path=' + path : '') +
                (secure ? '; secure' : '');
            return true;
        },

        removeItem: function (key, path, domain) {
            if (!this.hasItem(key)) {
                return false;
            }
            document.cookie = encodeURIComponent(key) +
                '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' +
                (domain ? '; domain=' + domain : '') +
                (path ? '; path=' + path : '');
            return true;
        },

        hasItem: function (key) {
            if (!key) {
                return false;
            }
            var pattern = new RegExp('(?:^|;\\s*)' +
                encodeURIComponent(key).replace(/[\-\.\+\*]/g, '\\$&') +
                '\\s*\\=');
            return pattern.test(document.cookie);
        },

        keys: function () {
            var keys = document.cookie.replace(
                /((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, '')
                .split(/\s*(?:\=[^;]*)?;\s*/);
            return keys.map(function (key) {
                return decodeURIComponent(key);
            });
        }
    };

    return cookies;
});
