import ioHook from 'iohook';

export default {
    name: 'MouseKeyboardActivityMixin',

    methods: {
        startMKTracker() {
            ioHook.start();
            ioHook.on('keyup', this.keyUpHandler);
            ioHook.on('mouseup', this.mouseUpHandler);
        },

        stopMKTracker() {
            sessionStorage.setItem('mouseKeyboardActivities', JSON.stringify({}));
            ioHook.removeListener('keyup', this.keyUpHandler);
            ioHook.removeListener('mouseup', this.mouseUpHandler);
            ioHook.stop();
        },

        saveMKActivities(type) {
            let mkActivities = JSON.parse(sessionStorage.getItem('mouseKeyboardActivities'));
            if (!mkActivities) {
                mkActivities = {};
            }
            mkActivities[type] = mkActivities[type] ? mkActivities[type] += 1 : 1;
            sessionStorage.setItem('mouseKeyboardActivities', JSON.stringify(mkActivities));
        },

        keyUpHandler(e) {
            this.saveMKActivities('keyboard');
        },

        mouseUpHandler(e) {
            this.saveMKActivities('mouse');
        }
    }
}
