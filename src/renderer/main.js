import Vue from 'vue';
import axios from './lib/axios';
import sileo from './lib/sileo/restmodel';
import plex from './lib/plex/core/js/restmodel';
import eventBus from './lib/event-bus';
import EventBusCallbacks from './plugins/event-bus-callbacks';

import App from './App';
import router from './router';
import store from './store';

// offline icons
import '@mdi/font/css/materialdesignicons.css'

if (!process.env.IS_WEB) Vue.use(require('vue-electron'));
Vue.config.productionTip = false;

sileo.defaults.baseUrl = store.getters['Sites/getSites']['API_URL'];
plex.defaults.baseUrl = store.getters['Sites/getSites']['API_URL'];

plex.defaults.headers['X-Requested-With'] = 'XMLHttpRequest';

const domain = 'applybpo.com';
const platform = 'desktop'

axios.defaults.headers.common['X-Domain'] = domain;
axios.defaults.headers.common['X-Platform'] = platform;

sileo.defaults.headers['X-Domain'] = domain;
sileo.defaults.headers['X-Platform'] = platform;

plex.defaults.headers['X-Domain'] = domain;
plex.defaults.headers['X-Platform'] = platform;

(async () => {
    if (localStorage.getItem('logged_in') && localStorage.getItem('auth_token')) {
        axios.defaults.headers.common['Authorization'] = localStorage.getItem('auth_token');
        sileo.defaults.headers['Authorization'] = localStorage.getItem('auth_token');
        plex.defaults.headers['Authorization'] = localStorage.getItem('auth_token');
    }

    router.beforeEach(async (to, from, next) => {
        if (localStorage.getItem('logged_in') && !store.getters['Auth/isLoggedIn']) {
            /*
            If Keep Me Signed In, try to get the user
            If token is expired, request new token using refresh token
            If refresh token is expired, logout user
            **/
            try {
                let response = await store.dispatch('Auth/getCurrentUser');
                store.commit('Auth/setUser', response)
            } catch (error) {
                let errorMessage = error.response.data.message;
                let refreshToken = localStorage.getItem('refresh_token');
                if (error.response.status === 403 && errorMessage.includes('expired')) {
                    await axios({
                        method: 'POST',
                        url: '/get-token/',
                        data: refreshToken,
                        headers: {
                            'X-Refresh-Token': refreshToken
                        }
                    }).then(async response => {
                        axios.defaults.headers.common['Authorization'] = response.access_token;
                        sileo.defaults.headers['Authorization'] = response.access_token;
                        plex.defaults.headers['Authorization'] = response.access_token;
                        localStorage.setItem('auth_token', response.access_token);
                        let user = await store.dispatch('Auth/getCurrentUser');
                        store.commit('Auth/setUser', user);
                    }).catch(error => {
                        store.dispatch('Auth/performLogout');
                    });
                }
            }
        }
        const isLoggedIn = store.getters['Auth/isLoggedIn'];
        const currentEmployment = JSON.parse(localStorage.getItem('current_employment') || null);

        if (currentEmployment && !store.getters['Employment/currentEmployment']) {
            await store.commit('Employment/setCurrentEmployment', currentEmployment);
        }

        if (to.meta.loginRequired && !isLoggedIn) {
            return next({replace: true, name: 'signin'});
        } else if (to.name == 'signin' && isLoggedIn) {
            return next({replace: true, name: 'select-employment'});
        } else if (to.name == 'select-employment' && store.getters['Employment/currentEmployment']) {
            return next({replace: true, name: 'tasks'});
        } else if (to.meta.currentEmploymentRequired && !store.getters['Employment/currentEmployment']) {
            return next({replace: true, name: 'select-employment'});
        }

        await store.dispatch('generics/initiateWebsocketConnection');

        next();
    });
})();

Vue.use(EventBusCallbacks, eventBus);

Vue.prototype.$eventBus = eventBus;

/* eslint-disable no-new */
new Vue({
    components: { App },
    router,
    store,
    template: '<App/>'
}).$mount('#app')
