import axios from '@/lib/axios.js';
import sileo from '@/lib/sileo/restmodel.js';
import plex from '@/lib/plex/core/js/restmodel.js';
import router from '@/router';

const state = {
    sites: {
        API_URL,
        APPLYBPO_URL,
        BPOSEATS_URL,
        BPOTUBE_URL,
        HQZEN_URL,
    },
};

const getters = {
    getSites(state) {
        return state.sites;
    }
};

const mutations = {};

const actions = {};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
