import { mapState } from 'vuex';

export default {
    name: 'ExternalLinkMixin',

    computed: {
        ...mapState('Auth', ['user']),
        ...mapState('Employment', ['currentEmployment']),
    },

    methods: {
        openExternalLink(link) {
            let finalLink = link;
            if (this.$route.name != 'signin') {
                let queryChar = link.includes('?') ? '&' : '?';
                finalLink += queryChar + 'desktop_user_id=' + this.user.pk + '&desktop_employment_id=' + this.currentEmployment.pk
            }
            this.$electron.shell.openExternal(finalLink);
        },
    },
};
