import axios from '@/lib/axios.js';
import sileo from '@/lib/sileo/restmodel.js';
import plex from '@/lib/plex/core/js/restmodel.js';
import router from '@/router';

const state = {
    user: null,
    tokens: null,
};

const getters = {
    tokens: state => state.tokens,

    isLoggedIn(state) {
        return state.user !== null;
    },

    userRegion(state) {
        if (state.user && state.user.user_profile) {
            return state.user.user_profile.region;
        }
        return null;
    },
};

const mutations = {
    setUser(state, user) {
        state.user = user;
        localStorage.setItem('logged_in', true);
    },

    clearUser(state) {
        state.user = null;
        localStorage.removeItem('logged_in');
    },

    setToken(state, tokens) {
        if (tokens) {
            state.tokens = tokens;
            axios.defaults.headers.common['Authorization'] = tokens.accessToken;
            sileo.defaults.headers['Authorization'] = tokens.accessToken;
            plex.defaults.headers['Authorization'] = tokens.accessToken;
            localStorage.setItem('auth_token', tokens.accessToken);
            localStorage.setItem('refresh_token', tokens.refreshToken);
        }
    },

    clearToken(state) {
        state.tokens = null;
        delete axios.defaults.headers.common['Authorization'];
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('logged_in');
    },
};

const actions = {
    performLogin({commit}, data) {
        return axios.post('/signin/', {
            data: data
        }).then(response => {
            if (response.error || response.warning) {
                return response;
            } else if (response.tfa_token) {
                localStorage.setItem('email', response.user.email);
                localStorage.setItem('tfa_token', response.tfa_token);
                return response;
            } else {
                if (Object.keys(response.user).length) {
                    commit('setUser', response.user);
                    commit('setToken', {
                        'accessToken': response.access_token,
                        'refreshToken': response.refresh_token
                    });
                }
                return response;
            }
        }).catch(response => {
            console.error(response);
        });
    },

    async performLogout({commit}) {
        try {
            await axios.get('/signout/');
        } catch (e) {
            console.log(e);
        }

        commit('clearUser');
        commit('clearToken');
        commit('Employment/clearCurrentEmployment', null, {root: true});

        delete axios.defaults.headers.common['Authorization'];
        delete sileo.defaults.headers['Authorization'];
        delete plex.defaults.headers['Authorization'];

        router.push({name: 'signin'});
    },

    getCurrentUser({commit, dispatch}) {
        return axios.get('/profile/me/');
    },

    async getWebsocketToken() {
        try {
            let data = await axios.get('/websocket-token/');
            return data.token;
        } catch (e) {
            return null;
        }
    }
};

export default {
    namespaced: true,
    state,
    getters,
    mutations,
    actions,
};
