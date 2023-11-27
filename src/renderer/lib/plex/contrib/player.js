(function (root, definition) {
    if (typeof define === 'function' && define.amd) {
        define([
            'stapes',
            'zepto',
            'mustache',
            'promise',
            'core/js/plex',
            'core/js/restmodel',
            'core/js/dragdrop/dragdrop',
            'core/js/cookies'
        ], definition);
    } else {
        root.HTML5Player = definition(root.Stapes, root.Zepto, root.Mustache,
            root.Promise, root.plex, {}, root.DragDrop, root.cookies);
    }
})(this, function (Stapes, Zepto, Mustache, Promise, plex, m, DragDrop,
    cookies) {
    /**
     *  Chooses a video type based on the types supported by the browser.
     *  @TODO Make this into a singleton module.
     */
    function supportedVideoType (choices) {
        if (choices) {
            // convert mpeg4 to mp4 for support checking
            choices = choices.map(function (choice) {
                return choice === 'mpeg4' ? 'mp4' : choice;
            });
        }
        var video = document.createElement('video');
        var types = ['webm', 'mp4'];
        if (video.canPlayType) {
            for (var i = 0, l = types.length; i < l; i++) {
                if (video.canPlayType('video/' + types[i]) && (!choices ||
                    (choices && choices.indexOf(types[i]) > -1))) {
                    return 'video/' + types[i];
                }
            }
        }
        return null;
    }

    /**
     *  Formats the given `time` into `mm:ss` format, or `mm:ss / mm:ss` if the
     *      `total` parameter is given.
     *  @TODO Make this method format times that reaches hours.
     */
    function formatTime (time, total) {
        function prefixZero (time) {
            return time < 10 ? '0' + time : time;
        }
        if (total === undefined) {
            var minutes = prefixZero(Math.floor(time / 60));
            var seconds = prefixZero(Math.floor(time % 60));
            return [minutes, seconds].join(':');
        } else {
            return [formatTime(time), formatTime(total)].join(' / ');
        }
    }

    /**
     *  Returns the appropriate classname for the given `volume`, which will be
     *  applied to the volume control button.
     */
    function volumeClass (volume) {
        if (volume >= 0.5) {
            return 'high';
        } else if (volume >= 0.015) {
            return 'medium';
        } else if (volume > 0) {
            return 'low';
        }
        return 'mute';
    }

    /**
     *  Checks if the site is accessed in a mobile environment.
     */
    function isMobile () {
        try {
            // used the TouchEvent interface to detect if in mobile, as
            // this will fail in desktop browsers
            var touch = document.createEvent('TouchEvent');
            return true;
        } catch (e) {
            return false;
        }
    }

    var Video = new m.Model('video', 'video-player');

    var videoTexts = {
        notAvailable: Mustache.render('{{_i18n}}This video is not available.{{/i18n}}', {}),
        stillEncoding: Mustache.render('{{_i18n}}Video Encoding. Check back in a few minutes.{{/i18n}}', {})
    };

    var HTML5Player = Stapes.subclass({
        constructor: function (element) {
            if (typeof element === 'string') {
                this.element = Zepto(element);
            } else {
                this.element = element;
            }
            this.controls = Zepto('.player-controls', this.element);

            this._bitrate = 360;
            this._volume = 1;
            this.slug = this.element.data('slug');
            this.dmca = this.element.data('dmca');
            this.flagArgs = {};
            this.type = supportedVideoType();
            this.src = null;
            this.players = [];
            this.index = 0;
            this._autoplay = false;
            this.is_encoding = 'live';

            // used to flag if the player is currently loading a video, so that
            // when the source is changed while still loading, it won't switch
            // to the wrong video element
            this.loading = false;

            // used to flag if whether the miniplayer just came from being
            // dragged around the screen, which will then lock the clicking on
            // the overlay or active video when it gets dropped
            this.dragged = false;

            // used to flag if the player should skip showing the play/pause
            // overlay buttons when it is played/paused
            this.skipState = false;

            // used to flag if a resize event is caused by a video element
            // entering fullscreen mode or not
            this.resizeByFullscreen = false;

            // used to store the promise object returned by calling the video
            // element's play method
            this.playPromise = null;
            this.playPromiseResolved = null;

            // store pending player actions, i.e. those actions that were
            // attempted to be performed on the player while it doesnt have
            // loaded sources yet
            this.pendingAction = null;

            // used to flag if the current video source exists
            this.videoExists = false;

            // used to flag whether the player has been previously initialized
            // (i.e. event handlers have been attached) or not.
            this.isInitialized = false;

            // used to keep track of mute state
            this._volumeBeforeMute = this._volume;

            for (var i = 0; i < 2; i++) {
                var container = Zepto('<div class="video-container"></div>');
                var player = document.createElement('video');
                player.preload = 'none';
                this.players.push(player);
                container.append(player);
                this.element.find('.video-wrapper').append(container);
            }
            this.player = this.players[this.index];
            Zepto(this.player).parent().addClass('active');

            this._createMessageOverlay();
            this._delegateMediaEvents();
            this._delegateLocalEvents();

            this._getEncodedUrls().then(function (data) {
                if (data !== undefined) {
                    this._initialize();
                    return data;
                }
            }.bind(this));
        },

        _initialize: function () {
            if (this.isInitialized) {
                return false;
            }
            this.isInitialized = true;

            if (plex.user !== null) {
                this._applyUserPreferences();
            }
            this._delegateInteractionEvents();
            this._readDataAttributes();

            this._checkFullscreenSupport();
            if (isMobile()) {
                this._mobileAdjustments();
            }
        },

        _delegateMediaEvents: function () {
            var player = this;
            var players = Zepto(this.players);

            this._enableBufferingDetection();

            players.on('loadedmetadata', function () {
                player._reflectProgress(0, this.duration);
            });

            players.on('timeupdate', function () {
                player._reflectProgress(this.currentTime, this.duration);
                if (this.currentTime >= this.duration) {
                    player.stop();
                }
            });

            players.on('progress', function () {
                if (player.player === this) {
                    var $progressBar =
                        player.controls.find('.progress-control');
                    var buffered = this.buffered;
                    var duration = this.duration;
                    var width = $progressBar.width();

                    $progressBar.find('.buffered').remove();
                    for (var i = 0, l = buffered.length; i < l; i++) {
                        var left = buffered.start(i) / duration * 100;
                        var right = 100 - buffered.end(i) / duration * 100;
                        var $timerange =
                            Zepto('<div class="progress buffered"></div>');
                        $timerange
                            .css({ left: left + '%', right: right + '%' });
                        $progressBar.append($timerange);
                    }
                }
            });

            players.on('play', function () {
                player.emit('play');
                if (player.player === this && !player.skipState) {
                    player._trigger('play');
                }
                player.controls.find('.play').toggleClass('play pause')
                    .data('action', 'pause');
                player.skipState = false;
                player._closeMessageOverlay();
            });

            players.on('pause', function () {
                player.emit('pause');
                player.controls.find('.pause').toggleClass('play pause')
                    .data('action', 'play');

                // if this is the end of the video
                if (this.currentTime >= this.duration || !this.currentTime) {
                    return false;
                }

                if (player.player === this && !player.skipState) {
                    player._trigger('pause', function () {
                        player._setState('play');
                    });
                }
                player.skipState = false;
            });

            players.on('timeupdate', function handler () {
                player._closeMessageOverlay();
                players.off('timeupdate', handler);
            });
        },

        _delegateInteractionEvents: function () {
            var player = this;

            this._enableAutoHideControls();
            this._enableVolumeControl();
            this._enableBitrateControl();
            this._enableFullscreenControl();
            this._enableVideoWatch();
            this._enableVideoFlagging();
            this._enableCollapsibleControls();
            this._enableCollapsedActions();

            this.controls.on('click', '.button-control', function (e) {
                e.stopImmediatePropagation();
                player[Zepto(this).data('action')](e);
            });

            this.controls.on('click', function (e) {
                if (player.element.hasClass('mini')) {
                    return false;
                }
                var $progressBar = Zepto(this).find('.progress-control');
                var left = $progressBar.offset().left;
                var right = left + $progressBar.width();
                if (e.pageX >= left && e.pageX <= right) {
                    var duration = 0;
                    if (player.player.readyState >=
                    player.player.HAVE_CURRENT_DATA) {
                        duration = player.player.duration;
                    }
                    var offset = e.pageX - left;
                    var time = duration * (offset / (right - left));
                    player.seek(time);
                }
            });

            // On iOS Safari, `click` events dont get fired right away, causing
            // the videoe player to not play/pause, therefore we are using
            // `touchstart`.
            //
            // Other event handlers dont need to use `touchstart` since on iOS
            // the video is played with its own UI and in fullscreen.
            const videoEvent = isMobile() ? 'touchstart' : 'click';

            this.element.on(videoEvent, 'video', function () {
                if (!player.dragged) {
                    if (!player.element.data('redirect-url')) {
                        player.controls.find('.button-control.play, ' +
                            '.button-control.pause').trigger('click');
                    }
                }
                player.dragged = false;
            });

            this.element.on('click', '.indicator-layer [data-action]',
                function () {
                    var action = Zepto(this).data('action');
                    player.emit('action', action);
                });

            Zepto(document).on('fullscreenchange mozfullscreenchange ' +
            'webkitfullscreenchange', function (e) {
                player.resizeByFullscreen = true;
                if (!document.fullscreenElement &&
                        !document.webkitFullscreenElement &&
                        !document.mozFullScreenElement) {
                    player.unfullscreen();
                }
            });

            Zepto(document).on('touchstart', function (e) {
                var target = Zepto(e.target);
                if (this._autoplay && (target.hasClass('no-touchstart') ||
                    target.closest('.no-touchstart').length > 0)) {
                    return;
                }
                if (!this.player.paused) {
                    this._autoplay = false;
                }
                if (this._autoplay) {
                    this._autoplay = false;
                    player.play();
                }
            }.bind(this));
        },

        _delegateLocalEvents: function () {
            var player = this;

            this.on('sourcesloaded', function () {
                player._checkVideoExistence();
            });

            this.on('videoexists', function () {
                if (player.pendingAction) {
                    player[player.pendingAction]();
                }
                player.pendingAction = null;
            });
        },

        _readDataAttributes: function () {
            if (this.element.data('ratio')) {
                var width = this.element.width();
                var ratio = +this.element.data('ratio');
                this.element.css('height', width / ratio + 'px');
            }

            if (this.element.data('poster')) {
                this.poster = this.element.data('poster');
            }
            Zepto(this.players).attr('poster', this.poster);

            // if (this.element.data('filmstrip')) {
            //     this._enableFilmstrip();
            // }

            if (this.element.data('mini-player') === true) {
                this._enableMiniPlayer();
            }

            if (this.element.data('autoplay')) {
                // player.autoplay explicitly set for autoplay feature to
                // properly work with firefox.
                this.player.autoplay = true;
                this.play(true);
            }

            if (this.element.data('controls') === false) {
                this.controls.css('display', 'none');
            }

            if (this.element.data('social-share')) {
                this._enableSocialShareLayer();
            }

            this.seekable = this.element.data('seekable') === '' ||
                Boolean(this.element.data('seekable'));
        },

        _checkFullscreenSupport: function () {
            if (!document.exitFullscreen && !document.webkitExitFullscreen &&
            !document.mozCancelFullScreen) {
                this.controls.find('.fullscreen').addClass('hidden');
                this.controls.find('.progress-control')
                    .addClass('no-fullscreen');
            }
        },

        _applyUserPreferences: function () {
            if (cookies.hasItem('cfvideosettings')) {
                var settings = JSON.parse(cookies.getItem('cfvideosettings'));
                this.bitrate(settings.bitrate);
                this.volume(settings.volume);
            }
        },

        _saveUserPreferences: function () {
            var data = { volume: this._volume, bitrate: this._bitrate };
            data = JSON.stringify(data);
            cookies.setItem('cfvideosettings', data, null, '/');
        },

        _mobileAdjustments: function () {
            this.controls.find('.bitrate').addClass('hidden');
            this.controls.find('.progress-control').addClass('mobile');
        },

        _getEncodedUrls: function (callback) {
            this.videoExists = false;
            return new Promise(function (resolve, reject) {
                if (!this.slug) {
                    this._showMessageOverlay(videoTexts.notAvailable,
                        this._getEncodedUrls.bind(this, callback));
                    return resolve();
                }
                Video.objects.filter({slug: this.slug}, function (data) {
                    if (data.length > 0) {
                        Zepto.extend(data[0], data[0].extension_bitrate_urls);
                        this.type = supportedVideoType(Object.keys(data[0]));
                        this.poster = data[0].thumbnail_url;
                        this.is_encoding = data[0].outputs_status;
                        var type = this.type
                            ? this.type.replace('video/', '') : null;
                        if (type) {
                            type = type === 'mp4' ? 'mpeg4' : type;
                            this._bitrates = data[0][type];
                            var bitrates = Object.keys(this._bitrates)
                                .sort(function (a, b) {
                                    if (+a < +b) {
                                        return -1;
                                    } else if (+a > +b) {
                                        return 1;
                                    }
                                    return 0;
                                });
                            var $bitrates = this.element
                                .find('.bitrate-popup').empty();
                            for (var i = 0; i < bitrates.length; i++) {
                                $bitrates.prepend('<li>' + bitrates[i] + 'p</li>');
                            }
                            if (bitrates.indexOf('' + this._bitrate) < 0 ||
                                    isMobile()) {
                                this._bitrate = +bitrates[0];
                                this.controls.find('.bitrate')
                                    .text(this._bitrate + 'p');
                            }
                            this.src = this._bitrates[this._bitrate];
                            var bitrate = this._bitrate + 'p';
                            $bitrates.children().filter(function () {
                                return Zepto(this).text() === bitrate;
                            }).addClass('current');
                            if (typeof callback === 'function') {
                                callback();
                            }
                            this._closeMessageOverlay();
                        } else {
                            this._showMessageOverlay(videoTexts.notAvailable,
                                this._getEncodedUrls.bind(this, callback));
                        }
                        resolve(data);
                        this.emit('sourcesloaded');
                    } else {
                        this._showMessageOverlay(videoTexts.notAvailable,
                            this._getEncodedUrls.bind(this, callback));
                        return resolve();
                    }
                }.bind(this));
            }.bind(this));
        },

        _enableFilmstrip: function () {
            var $filmstrip = Zepto('<div class="filmstrip hidden"></div>');
            var filmstrip = this.element.data('filmstrip');
            $filmstrip.css('background-image', 'url("' + filmstrip + '")');
            this.element.find('.player-overlay').before($filmstrip);

            var filmstripFound = false;
            var filmstripWidth, filmstripHeight;
            var image = document.createElement('img');
            image.src = filmstrip;
            image.onload = function () {
                filmstripFound = true;
            };

            var _filmstripTimer = null;
            this.element.on('mouseenter', function () {
                _filmstripTimer = setTimeout(function () {
                    var element = Zepto(this);
                    $filmstrip.removeClass('hidden');
                    if (element.hasClass('idle') && filmstripFound) {
                        var ratio = +element.data('ratio');
                        var width = element.width();
                        var height = element.height();
                        element.css('height', width / ratio + 'px');

                        var i = 0;
                        var backgroundHeight =
                            image.height / (image.width / width);
                        $filmstrip.css('background-position-y', 0);
                        _filmstripTimer = setInterval(function () {
                            var offset = -height * ++i - i / 2;
                            if (offset < -backgroundHeight) {
                                offset = 0;
                                i = 0;
                            }
                            $filmstrip.css('background-position',
                                '0 ' + offset + 'px');
                        }, 1000);
                    }
                }.bind(this), 300);
            });

            this.element.on('mouseleave', function () {
                clearTimeout(_filmstripTimer);
                clearInterval(_filmstripTimer);
                $filmstrip.addClass('hidden');
            });
        },

        _enableMiniPlayer: function () {
            function scrollElement (element) {
                return element === document
                    ? (document.scrollingElement || document.body)
                    : element;
            }

            function visibility (trigger, element) {
                trigger = Zepto(scrollElement(trigger));
                var scrollTop = trigger.scrollTop();
                var scrollBottom = scrollTop + window.innerHeight;
                var offset = trigger.is('.miniplayer-trigger') ? scrollTop : 0;
                var top = element.offset().top + offset;
                var bottom = top + element.height();
                var visibility = (Math.min(scrollBottom, bottom) -
                    Math.max(scrollTop, top)) / (bottom - top);
                return Math.max(visibility, 0);
            }

            window.addEventListener('scroll', function (e) {
                if (Zepto(e.target).hasClass('miniplayer-trigger') ||
                e.target === document) {
                    if (visibility(e.target, this.element) < 0.3) {
                        this.element.addClass('mini');
                        this.emit('miniplayer:active');
                    } else {
                        this.element.removeClass('mini');
                        this.element.find('.video-container')
                            .removeAttr('style');
                        this.emit('miniplayer:inactive');
                    }
                }
            }.bind(this), true);

            this._enableResponsiveMiniPlayer();
            this._enableDraggableMiniPlayer();
        },

        _enableResponsiveMiniPlayer: function () {
            var player = this;
            var _window = Zepto(window);
            var miniplayer = false;
            var elements = this.element
                .find('.player-overlay, .indicator-layer');

            var _syncBasis = this.element.find('.indicator-layer');
            var _syncTimeoutTimer, _syncIntervalTimer, _syncCache;

            function syncMiniPlayerElements (e) {
                if (player.resizeByFullscreen) {
                    player.resizeByFullscreen = false;
                    return false;
                }
                if (!player.element.hasClass('mini')) {
                    return false;
                }
                var active = player.element.find('.video-container.active');
                var notactive = player.element.find('.video-container')
                    .not('.active');

                if (!active.length) {
                    return false;
                }

                active.add(notactive).css({ 'width': '', 'height': '' });
                elements.add(player.element.find('.message-overlay'))
                    .add(notactive).css({
                        'height': active.height(),
                        'padding-top': 0
                    });
                var clientRect = active[0].getBoundingClientRect();
                if (clientRect.left < 0 || clientRect.right > window.innerWidth ||
                clientRect.top < 0 || clientRect.bottom > window.innerHeight) {
                    var pad = window.innerWidth > 800 ? '25px' : '15px';
                    elements.add(player.element.find('.message-overlay'))
                        .add(active).add(notactive).css({
                            'top': 'auto',
                            'left': 'auto',
                            'right': pad,
                            'bottom': pad
                        });
                }
                elements.height(player.element
                    .find('.video-container.active').height())
                    .css('padding-top', 0);
                if (player.player.paused) {
                    elements.removeClass('hidden');
                } else {
                    elements.not('.player-overlay').removeClass('hidden');
                }
            }

            this.element.on('animationend', '.video-container',
                syncMiniPlayerElements);

            Zepto(window).on('resize', syncMiniPlayerElements);

            this.on('sourcechanged', function () {
                if (miniplayer) {
                    elements.addClass('hidden');
                }
            });

            this.on('miniplayer:active', function () {
                if (!miniplayer) {
                    elements.addClass('hidden');
                    miniplayer = true;
                }
            });

            this.on('miniplayer:inactive', function () {
                elements.removeAttr('style');
                miniplayer = false;
            });
        },

        _enableDraggableMiniPlayer: function () {
            var player = this;
            var dragdrop = null;
            var dragged = null;

            this.on('miniplayer:active', function () {
                if (!dragdrop) {
                    player.element
                        .find('.video-container, .player-overlay, ' +
                            '.message-overlay')
                        .addClass('js-dragdrop-handle');

                    dragdrop = DragDrop('.html-player.mini ' +
                        '.video-container, ' +
                        '.html-player.mini .player-overlay, ' +
                        '.html-player.mini .indicator-layer, ' +
                        '.html-player.mini .message-overlay', {
                        constrain: window.innerWidth < 800 ? 15 : 25,
                        ondrag: function () {
                            return player.element.hasClass('mini');
                        }
                    });

                    dragdrop.on('dragdrop:drag', function (position) {
                        player.dragged = true;
                        player.element.removeClass('snap-left snap-right')
                            .find('.video-container, .player-overlay, ' +
                                '.indicator-layer, .message-overlay')
                            .css({
                                top: position.y + 'px',
                                left: position.x + 'px',
                                right: 'auto',
                                bottom: 'auto'
                            });
                        player.emit('miniplayer:drag');
                    });

                    dragdrop.on('dragdrop:drop', function (position) {
                        if (isMobile()) {
                            player.dragged = false;
                        }
                        var left = position.x;
                        var right = Zepto(window).width() - (position.x +
                            player.element.find('.video-container.active')
                                .width());
                        if (left < right) {
                            player.element.addClass('snap-left');
                        } else {
                            player.element
                                .find('.video-container.active, ' +
                                    '.player-overlay, .indicator-layer, ' +
                                    '.message-overlay')
                                .css('right', right);
                            setTimeout(function () {
                                player.element.addClass('snap-right');
                            }, 0);
                        }
                        player.emit('miniplayer:drop');
                    });
                }
            });

            this.on('miniplayer:inactive', function () {
                if (dragdrop) {
                    dragdrop.off('dragdrop:drag');
                    dragdrop.off('dragdrop:drop');
                    dragdrop.deactivate();
                    dragdrop = null;
                    player.element.removeClass('snap-left snap-right')
                        .find('.video-container.active, .player-overlay, ' +
                            '.message-overlay')
                        .removeAttr('style').removeClass('js-dragdrop-handle');
                }
            });

            this.element.on('click', '.active video, .player-overlay, ' +
            '.message-overlay', function (e) {
                if (dragdrop) {
                    // hijack internal dragdrop properties to force a
                    // fake drop when playing/pausing the mini player
                    dragdrop._dragged = true;
                    dragdrop._element = Zepto(this);
                    dragdrop.activateDrop(e);
                }
            }
            );
        },

        _enableAutoHideControls: function () {
            var player = this;

            function hideControls () {
                player.controls.removeClass('visible');
                player.emit('controls-hide');

                player._closePopupsExcept();
            }

            var _controlsTimer = null;
            this.element.on('mouseenter', function () {
                if (!Zepto(this).hasClass('idle')) {
                    player.controls.addClass('visible');
                    player.emit('controls-show');

                    _controlsTimer = setTimeout(hideControls, 3000);
                }
            });

            this.element.on('mousemove', function () {
                if (!Zepto(this).hasClass('idle')) {
                    clearTimeout(_controlsTimer);
                    player.controls.addClass('visible');
                    player.emit('controls-show');

                    _controlsTimer = setTimeout(hideControls, 3000);
                }
            });
        },

        _enableVolumeControl: function () {
            var player = this;

            function updateVolume (e) {
                var target = player.controls.find('.volume-control');
                var offset = e.pageX - target.offset().left;
                var volume = offset / target.width();
                if (volume >= 0 && volume <= 1) {
                    player.volume(volume);
                }
            }

            this.controls.find('.volume').on('click', function (e) {
                e.stopPropagation();
                player._closePopupsExcept('.volume-popup');
                player.volume(player.player.volume);
                player.controls.find('.volume-popup').toggleClass('hidden');
            });

            this.controls.find('.volume').on('dblclick', function () {
                const action = Zepto(this).data('action');

                if (action === 'volume') {
                    const muteAction = player._volume === 0 ? 'unmute' : 'mute';
                    player[muteAction]();
                    player.controls.find('.volume-popup').addClass('hidden');
                }
            });

            var adjustingVolume = false;
            this.controls.on('mousedown', '.volume-control', function (e) {
                adjustingVolume = true;
                updateVolume(e);
            });

            this.element.on('mousemove', function (e) {
                if (adjustingVolume) {
                    updateVolume(e);
                }
            });

            Zepto(document).on('mouseup', function () {
                adjustingVolume = false;
            });
        },

        _enableBitrateControl: function () {
            var player = this;

            this.controls.find('.bitrate').on('click', function (e) {
                e.stopPropagation();
                player._closePopupsExcept('.bitrate-popup');
                player.controls.find('.bitrate-popup').toggleClass('hidden');
            });

            this.controls.find('.bitrate-popup').on('click', 'li', function () {
                var bitrate = +Zepto(this).text().replace(/p$/, '');
                player._closePopupsExcept();
                player.bitrate(bitrate);
            });
        },

        _enableFullscreenControl: function () {
            var player = this;

            this.controls.find('.fullscreen, .exit-fullscreen').on('click',
                function (e) {
                    e.stopPropagation();
                    if (Zepto(this).is('.fullscreen')) {
                        player.fullscreen();
                    } else {
                        player.unfullscreen();
                    }
                });
        },

        _enableVideoWatch: function () {
            var player = this;
            var players = Zepto(this.players);
            var watchSent = false;
            var watched = false;
            var firstTimeUpdateTriggered = false;

            this.on('sourcechanged', function (keepTime) {
                if (!keepTime) {
                    watchSent = false;
                    watched = false;
                    firstTimeUpdateTriggered = false;
                    players.on('timeupdate', timeUpdateCallback);
                }
            });

            players.on('timeupdate', timeUpdateCallback);

            function timeUpdateCallback () {
                if (!watchSent && !watched && firstTimeUpdateTriggered && player.player.currentTime) {
                    watchSent = true;
                    var watchUrl = m.defaults.baseUrl + '/video/add/watch/' + player.slug + '/1/';
                    Zepto.ajax({
                        beforeSend: function (xhr, settings) {
                            var csrftoken = cookies.getItem('csrftoken');
                            xhr.setRequestHeader('X-CSRFToken', csrftoken);
                            for (var key in m.defaults.headers) {
                                var value = m.defaults.headers[key];
                                if (typeof value === 'function') {
                                    xhr.setRequestHeader(key, value());
                                } else if (value) {
                                    xhr.setRequestHeader(key, value);
                                }
                            }
                        },
                        type: 'POST',
                        url: watchUrl,
                        success: function (data) {
                            data = data || null;
                            watched = true;
                            players.off('timeupdate', timeUpdateCallback);
                            player.emit('videowatched', data);
                        },
                        error: function () {
                            watchSent = false;
                        }
                    });
                }
                firstTimeUpdateTriggered = true;
            }
        },

        _enableVideoFlagging: function () {
            var player = this;

            this.controls.find('.flag').on('click', function (e) {
                e.stopPropagation();
                player.flag();
            });
        },

        _enableCollapsibleControls: function () {
            var collapseMap = {
                300: 'collapse-fullscreen collapse-bitrate collapse-volume',
                230: 'collapse-flag',
                210: 'collapse-time'
            };

            var enableCollapsibleControls = function () {
                var width = this.element.width();
                for (var breakpoint in collapseMap) {
                    var method = width <= breakpoint ? 'add' : 'remove';
                    this.element[method + 'Class'](collapseMap[breakpoint]);
                }
            }.bind(this);

            enableCollapsibleControls();
            Zepto(window).on('resize', enableCollapsibleControls);

            this.on('play', enableCollapsibleControls);

            this.on('fullscreen', function () {
                this._closePopupsExcept();
            }.bind(this));
        },

        _enableCollapsedActions: function () {
            var player = this;

            this.controls.find('.actions').on('click', function (e) {
                e.stopPropagation();
                player._closePopupsExcept('.collapsed-popup');
                player.controls.find('.collapsed-popup').toggleClass('hidden');
            });
        },

        _enableBufferingDetection: function () {
            var player = this;
            var players = Zepto(this.players);
            var bufferCheckTimer = 0;

            function setBufferTimeout (delay) {
                bufferCheckTimer = setTimeout(function () {
                    if (!player.player.paused) {
                        player._setState('loading');
                    }
                }, 500);
            }

            players.on('progress seeked', function () {
                if (!bufferCheckTimer) {
                    setBufferTimeout();
                }
            });

            players.on('play', function () {
                clearTimeout(bufferCheckTimer);
                setBufferTimeout();
            });

            players.on('timeupdate', function () {
                this._clearState();
                clearTimeout(bufferCheckTimer);
                setBufferTimeout();
            }.bind(this));
        },

        _enableSocialShareLayer: function () {
            var player = this;
            var layer = Zepto('<div class="social-share-layer hidden"></div>');
            this.element.append(layer);
            this.emit('socialsharelayer', layer);

            var isIPhone = /iphone/i.test(navigator.userAgent);

            this.element.on('click', '.social-share-layer', function (e) {
                if (Zepto(e.target).is('.social-share-layer')) {
                    player.controls.find('.button-control.play, ' +
                        '.button-control.pause').trigger('click');
                }
            });

            this.on('play', function () {
                layer.addClass('hidden');
                if (isIPhone) {
                    player.element.removeClass('hidden-videos');
                }
            });

            this.on('stop', function () {
                layer.removeClass('hidden');
                if (isIPhone) {
                    player.element.addClass('hidden-videos');
                }
            });
        },

        _reflectProgress: function (time, total) {
            var $progress = this.controls.find('.progress.current');
            var $time = this.controls.find('.info-control.time');
            $progress.css('width', Math.round(time / total * 100) + '%');
            $time.html(formatTime(time || 0, total || 0));
        },

        _closePopupsExcept: function (popup) {
            this.controls.find('.player-popup').not(popup || 'html')
                .addClass('hidden');
        },

        _trigger: function (state, callback) {
            var player = this;
            var $overlay = this.element.find('.player-overlay');
            var $icon = $overlay.children('span');
            state = $icon.hasClass('replay') ? 'replay' : state;
            this._setState(state);

            setTimeout(function () {
                $overlay.addClass('triggered');
                if (!this.transitioning) {
                    this.transitioning = setTimeout(function () {
                        if ($icon.hasClass('pause')) {
                            this._setState('play');
                        }
                        if ($icon.hasClass('replay')) {
                            $icon.removeClass('replay');
                        }
                        this.transitioning = null;

                        if (typeof callback === 'function') {
                            callback();
                        }
                    }.bind(this), 350);
                }
            }.bind(this), 50);
        },

        _setState: function (state) {
            var $overlay = this.element.find('.player-overlay');
            $overlay.children('span').attr('class', '').addClass(state);
            $overlay.removeClass('triggered hidden');
        },

        _clearState: function () {
            var $overlay = this.element.find('.player-overlay');
            if (!this.player.paused && !$overlay.hasClass('triggered')) {
                $overlay.children('span').attr('class', '');
                $overlay.addClass('hidden');
            }
        },

        _createMessageOverlay: function () {
            this.messageOverlay = Zepto('<div class="message-overlay js-dragdrop-handle hidden"></div>');
            this.element.append(this.messageOverlay);
        },

        _showMessageOverlay: function (message, retry, persistent) {
            this.messageOverlay.html('<h2>' + message + '</h2>');
            if (persistent) {
                this.messageOverlay.addClass('persistent');
            }
            this.messageOverlay.removeClass('hidden');

            if (typeof retry === 'function') {
                this.messageOverlay.append('<button type="button" class="btn btn-default">' +
                    '<i class="fa fa-repeat"></i>' +
                    Mustache.render('{{_i18n}}Retry{{/i18n}}', {}) +
                    '</button>');
                this.messageOverlay.find('.btn').on('click', function () {
                    retry();
                });
            }
        },

        _closeMessageOverlay: function (force) {
            if (force === true || !this.messageOverlay.hasClass('persistent')) {
                this.messageOverlay.addClass('hidden');
            }
        },

        _checkVideoExistence: function () {
            var player = this;

            if (this.is_encoding === 'pending') {
                player._showMessageOverlay(videoTexts.stillEncoding,
                    this._getEncodedUrls.bind(this, function () {}));
            } else if (this.is_encoding === 'error') {
                player._showMessageOverlay(videoTexts.notAvailable,
                    this._getEncodedUrls.bind(this, function () {}));
            } else {
                var slug = this.slug;
                Zepto.ajax({
                    url: this.src,
                    type: 'HEAD',
                    beforeSend: function (xhr, settings) {
                        xhr.setRequestHeader('Cache-Control', 'max-age=0');
                    },
                    success: function (response) {
                        if (player.slug === slug) {
                            player._closeMessageOverlay();
                            player.videoExists = true;
                            player.emit('videoexists');
                        }
                    },
                    error: function (error) {
                        if (player.slug === slug) {
                            if (player.player.readyState === 0) {
                                player._showMessageOverlay(
                                    videoTexts.notAvailable,
                                    player._checkVideoExistence.bind(player));
                            }
                        }
                    }
                });
            }
        },

        _changeSource: function (url, keepTime) {
            var player = this;
            var current = +this.player.currentTime.toFixed(6);
            var paused = this.player.paused;
            if (this.playPromiseResolved !== false) {
                this.player.pause();
            }
            this._autoplay = true;

            if (!this.element.hasClass('idle')) {
                if (this.loading) {
                    Zepto(this.player).off('canplay');
                } else {
                    this.index = ++this.index % 2;
                    this.player = this.players[this.index];
                }
            }

            var changeSource = function () {
                Zepto(this.players).attr('poster', this.poster);
                if (!this.element.hasClass('idle')) {
                    this.player.src = this.src;
                    if (!paused || !keepTime) {
                        this.play(!keepTime, true);
                    }
                }

                this._initialize();
            }.bind(this);

            if (keepTime) {
                if (this._bitrates &&
                this._bitrates.hasOwnProperty(this._bitrate)) {
                    this._closeMessageOverlay();
                    this.src = this._bitrates[this._bitrate];
                    changeSource();
                } else {
                    this._showMessageOverlay(videoTexts.notAvailable,
                        this._changeSource.bind(this, url, keepTime));
                    return;
                }
            } else {
                setTimeout(function () {
                    this.seek(0);
                    this.controls.find('.progress').css('width', 0);
                    this._setState('loading');
                }.bind(this), 0);
                this._getEncodedUrls(changeSource);
            }

            if (!this.element.hasClass('idle')) {
                Zepto(this.player).on('canplay', function (e) {
                    var currentTime = +this.currentTime.toFixed(6);
                    if (keepTime && currentTime === current) {
                        if (paused) {
                            player.pause(true);
                            player._setState('play');
                        } else {
                            player.play();
                            player._clearState();
                        }
                    } else if (keepTime && currentTime !== current) {
                        player._reflectProgress(current, this.duration);
                        this.currentTime = current;
                        player.loading = true;
                        if (this.readyState >= this.HAVE_FUTURE_DATA) {
                            if (paused) {
                                player.pause(true);
                                player._setState('play');
                            } else {
                                player.play();
                                player._clearState();
                            }
                        } else {
                            return null;
                        }
                    }
                    Zepto(this).off('canplay').parent().addClass('active');
                    Zepto(player.players[(player.index + 1) % 2])
                        .removeAttr('src').parent().removeClass('active');
                    player.loading = false;
                    player.emit('sourcechanged', keepTime);
                });
            } else {
                player.emit('sourcechanged', keepTime);
            }
        },

        _activate: function () {
            if (this.element.hasClass('idle') && this.src &&
            this.videoExists) {
                this.player.src = this.src;
                this.player.load();
                this.controls.removeClass('hidden');
                this.element.removeClass('idle');
            } else if (!this.src || !this.videoExists) {
                this.pendingAction = 'play';
            }
        },

        play: function (load, skipState) {
            if (!document.body.contains(this.element[0])) {
                return false;
            } else if (!this.videoExists) {
                this.pendingAction = 'play';
            }
            this.skipState = skipState === true;
            this._activate();
            this.player.volume = this._volume;

            if (!this.src || !this.videoExists) {
                return false;
            }

            if (load === true) {
                this.player.load();
                Zepto(this.players).on('canplaythrough', function (e) {
                    if (e.target === this.player) {
                        this.playPromise = e.target.play();
                        if (this.playPromise) {
                            this.playPromiseResolved = false;
                            this.playPromise.then(function () {
                                this.playPromiseResolved = true;
                            }.bind(this)).catch(console.log.bind(console));
                        }
                        Zepto(this.players).off('canplaythrough');
                    }
                }.bind(this));
            } else {
                this.playPromise = this.player.play();
                if (this.playPromise) {
                    this.playPromiseResolved = false;
                    this.playPromise.then(function () {
                        this.playPromiseResolved = true;
                    }.bind(this)).catch(console.log.bind(console));
                }
            }

            this.element.addClass('playing');
        },

        pause: function (skipState) {
            this.skipState = skipState === true;
            if (this.playPromiseResolved !== false) {
                this.player.pause();
            }

            this.element.removeClass('playing');
        },

        stop: function (skipState) {
            if (this.playPromiseResolved !== false) {
                this.player.pause();
            }
            this.seek(0);
            this.emit('stop');

            this.element.removeClass('playing');
            if (!skipState) {
                this._setState('replay');
            }
        },

        seek: function (time) {
            if (!this.seekable) {
                return false;
            }
            if (this.player.readyState >= this.player.HAVE_CURRENT_DATA) {
                this.player.currentTime = time;
                this._reflectProgress(time, this.player.duration);
                this.emit('seek', time);
            }
        },

        volume: function (volume) {
            volume = Number.isFinite(volume) ? volume : 1;
            volume = Math.min(volume, 1);
            volume = Math.max(volume, 0);

            this._volume = volume;
            this.player.volume = volume;
            this._saveUserPreferences();
            this.controls.find('.volume-popup .current')
                .css('width', volume * 100 + '%');
            this.controls.find('.volume').removeClass('mute low medium high')
                .addClass(volumeClass(volume));
        },

        mute () {
            this._volumeBeforeMute = this._volume;
            this.volume(0);
        },

        unmute () {
            this.volume(this._volumeBeforeMute);
        },

        bitrate: function (bitrate, activate) {
            if (this._bitrate !== bitrate) {
                var current = this.controls.find('.bitrate-popup li')
                    .filter(function () {
                        return Zepto(this).text() === bitrate + 'p';
                    });
                this._bitrate = bitrate;
                this._saveUserPreferences();
                this.controls.find('.bitrate-popup li').removeClass('current');
                this.controls.find('.bitrate').text(current.text());
                current.addClass('current');
                if (activate || activate === undefined) {
                    this.source(this.slug, true);
                }
            }
        },

        fullscreen: function () {
            this.resizeByFullscreen = true;
            var element = this.element.get(0);
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            }
            this.controls.find('.collapsed-popup .fullscreen')
                .text('Exit Fullscreen');
            this.controls.find('.fullscreen')
                .toggleClass('fullscreen exit-fullscreen')
                .data('action', 'unfullscreen');
            this.element.addClass('fullscreen-mode');
            this.emit('fullscreen');
        },

        unfullscreen: function () {
            this.resizeByFullscreen = true;
            if (document.fullscreenElement && document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitFullscreenElement &&
                    document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.mozFullScreenElement &&
                    document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            this.controls.find('.collapsed-popup .exit-fullscreen')
                .text('Fullscreen');
            this.controls.find('.exit-fullscreen')
                .toggleClass('fullscreen exit-fullscreen')
                .data('action', 'fullscreen');
            this.element.removeClass('fullscreen-mode');
            this.emit('unfullscreen');
        },

        flag: function (e) {
            var url = this.dmca + '?video=' + this.slug;
            for (var key in this.flagArgs) {
                if (this.flagArgs.hasOwnProperty(key)) {
                    url += '&' + key + '=' + this.flagArgs[key];
                }
            }
            window.open(url, '_blank');
        },

        setFlagArgs: function (args) {
            this.flagArgs = args;
        },

        reset: function () {
            this.slug = null;
            this.src = null;
            this._bitrates = null;
            this.is_encoding = 'live';
            this.loading = false;
            this.flagArgs = {};

            this.players.forEach(function (player) {
                player.src = '';
                player.poster = '';
                player.load();
            });
        },

        source: function (slug, same) {
            this.slug = slug;
            this._changeSource(slug, same === true);
        },

        // deprecated, kept for backward compatibility
        playNewSource: function (slug) {
            this.source(slug);
        },

        setControlsWidth (width, sideToAdjust) {
            var instance = this;
            var controlsMargin = 20;
            var overallWidth = this.element.width();
            var controlsWidth = (overallWidth * width) - controlsMargin;
            var adjustedSideValue = overallWidth - controlsWidth;
            this.controls.css(sideToAdjust, adjustedSideValue + 'px');

            function addOrRemoveClass (threshold) {
                return controlsWidth <= threshold ? 'addClass' : 'removeClass';
            }

            this.controls.find('.button-control.flag')[addOrRemoveClass(350)]('hidden');
            this.controls.find('.button-control.volume')[addOrRemoveClass(320)]('hidden');
            this.controls.find('.button-control.bitrate')[addOrRemoveClass(280)]('hidden');
            this.controls.find('.info-control.time')[addOrRemoveClass(200)]('hidden');
            this.controls.find('.button-control.fullscreen')[addOrRemoveClass(100)]('hidden');
            this.controls.find('.progress-control')[addOrRemoveClass(38)]('hidden');
            if (controlsWidth <= 100) {
                this.controls.find('.progress-control').css('margin-right', '8px');
            } else {
                this.controls.find('.progress-control').css('margin-right', '');
            }
            this.controls[width < 0.1 ? 'addClass' : 'removeClass']('hidden');
        },

        setOverlayWidth (width, sideToAdjust) {
            var overallWidth = this.element.width();
            var overlayWidth = overallWidth * width;
            var adjustedSideValue = overallWidth - overlayWidth;
            this.element.find('.player-overlay').css(sideToAdjust, adjustedSideValue + 'px');
        }
    });

    return HTML5Player;
});
