const debounce = function (fn, timeout, runOnStart = false) {
    var timer;
    var locked;
    return function () {
        var args = arguments;
        var context = this;

        clearTimeout(timer);
        if (runOnStart) {
            if (!locked) {
                locked = true;
                fn.apply(context, args);
            }
            timer = setTimeout(function () {
                locked = false;
            }, timeout);
        } else {
            timer = setTimeout(function () {
                fn.apply(context, args);
            }, timeout);
        }
    };
};

export default debounce;
