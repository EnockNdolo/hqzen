(function (root, declaration) {
    if (typeof define === 'function' && define.amd) {
        define(['zepto', 'stapes'], declaration);
    } else {
        root.DragDrop = declaration(root.Zepto, root.Stapes);
    }
})(this, function (Zepto, Stapes) {
    var defaultConfig = {
        container: window,
        handle: '.js-dragdrop-handle'
    };

    var DragDrop = Stapes.subclass({
        constructor: function (config) {
            this.element = config.element;
            this.container = Zepto(config.container);
            this.handle = config.handle;
            this.config = config;
            this._element = null;
            this._dragged = false;
            this._adjustment = { x: 0, y: 0 };

            this.activate();
        },

        activate: function () {
            this._initializeDrag = this.initializeDrag.bind(this);
            this._activateDrag = this.activateDrag.bind(this);
            this._activateDrop = this.activateDrop.bind(this);

            this.container.on('mousedown', this.element, this._initializeDrag);
            this.container.on('mousemove', this._activateDrag);
            Zepto(document).on('mouseup', this._activateDrop);

            this.container.on('touchstart', this.element,
                this._initializeDrag);
            this.container.on('touchmove', this._activateDrag);
            Zepto(document).on('touchend', this._activateDrop);
        },

        deactivate: function () {
            this.container.off('mousedown', this.element,
                this._initializeDrag);
            this.container.off('mousemove', this._activateDrag);
            Zepto(document).off('mouseup', this._activateDrop);

            this.container.off('touchstart', this.element,
                this._initializeDrag);
            this.container.off('touchmove', this._activateDrag);
            Zepto(document).off('touchend', this._activateDrop);
        },

        initializeDrag: function (e) {
            if (Zepto(e.target).closest(this.handle).length) {
                this._element = Zepto(e.target).closest(this.element);
                var position = this._element.position();
                var pointer = pointerPosition(e);
                this._adjustment = {
                    x: pointer.x - position.left,
                    y: pointer.y - position.top
                };
            }
        },

        activateDrag: function (e) {
            if (this._element) {
                e.preventDefault();
                this._dragged = true;
                var pointer = {
                    x: e.clientX === undefined
                        ? e.touches[0].clientX : e.clientX,
                    y: e.clientY === undefined
                        ? e.touches[0].clientY : e.clientY
                };
                var position = {
                    x: pointer.x - this._adjustment.x,
                    y: pointer.y - this._adjustment.y
                };
                position = this._constrain(position);
                if (this._ondrag(position)) {
                    this._element.css({
                        top: position.y + 'px',
                        left: position.x + 'px',
                        right: 'auto',
                        bottom: 'auto'
                    });
                    this.emit('dragdrop:drag', position);
                }
            }
        },

        activateDrop: function (e) {
            if (this._dragged) {
                var pointer = {
                    x: e.clientX === undefined
                        ? e.changedTouches[0].clientX : e.clientX,
                    y: e.clientY === undefined
                        ? e.changedTouches[0].clientY : e.clientY
                };
                var position = {
                    x: pointer.x - this._adjustment.x,
                    y: pointer.y - this._adjustment.y
                };
                position = this._constrain(position);
                this._element = null;
                this._dragged = false;
                this.emit('dragdrop:drop', position);
            }
        },

        _constrain: function (position) {
            if (typeof this.config.constrain === 'number') {
                var constrain = this.config.constrain;
                if (position.x < constrain) {
                    position.x = constrain;
                } else if (position.x + this._element.width() >
                        this.container.width() - constrain) {
                    position.x = this.container.width() - constrain -
                        this._element.width();
                }
                if (position.y < constrain) {
                    position.y = constrain;
                } else if (position.y + this._element.height() >
                        this.container.height() - constrain) {
                    position.y = this.container.height() - constrain -
                        this._element.height();
                }
            }
            return position;
        },

        _ondrag: function (position) {
            if (typeof this.config.ondrag === 'function') {
                return this.config.ondrag(position);
            }
            return true;
        }
    });

    function pointerPosition (e) {
        if ('touches' in e && e.touches.length > 0) {
            return { x: e.touches[0].pageX, y: e.touches[0].pageY };
        }
        return { x: e.pageX, y: e.pageY };
    }

    function extend (base, extension) {
        function _extend (a, b) {
            for (var key in b) {
                if (b.hasOwnProperty(key)) {
                    a[key] = b[key];
                }
            }
            return a;
        }

        var extended = _extend({}, base);
        return _extend(extended, extension);
    }

    function dragdrop (element, config) {
        config = extend(defaultConfig, config || {});
        config.element = element;
        return new DragDrop(config);
    }

    return dragdrop;
});
