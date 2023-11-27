define(['core/js/restmodel'], function () {
    var plex = {
        user: localStorage.getItem('auth_token'),
        settings: {}
    };

    plex.settings.getStaticLocation = function (asset) {
        return plex.settings.STATIC_URL + asset;
    };

    plex.settings.getVideoLocation = function (asset) {
        return plex.settings.VIDEO_URL + asset;
    };

    return plex;
});
