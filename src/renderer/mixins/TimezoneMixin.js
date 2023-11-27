import { mapGetters } from 'vuex';
import moment from 'moment-timezone';

export default {
    name: 'TimezoneMixin',

    computed: {
        ...mapGetters('Auth', ['userRegion']),
    },

    methods: {
        timezoneFormat(timestamp, format, region) {
            let r = this.userRegion ? this.userRegion : this.getTimezoneGuessedRegion();
            if (region) {
                r = region;
            }
            if (timestamp) {
                let instance = moment.tz(timestamp, r);
                if (instance.isValid()) {
                    return instance.format(format);
                }
            }
            return moment.tz(this.userRegion).format(format);
        },

        getMomentInstance(timestamp, region) {
            let r = this.userRegion ? this.userRegion : this.getTimezoneGuessedRegion();
            if (region) {
                r = region;
            }
            return moment.tz(timestamp, r);
        },

        getTimezoneRegionNames() {
            return moment.tz.names();
        },

        getTimezoneGuessedRegion() {
            return moment.tz.guess();
        },

        getMomentInstanceOfMachine(timestamp) {
            if (timestamp) {
                return moment(timestamp);
            }
            return moment();
        },
    },
};
