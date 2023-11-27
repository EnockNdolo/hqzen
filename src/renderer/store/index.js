import Vue from 'vue';
import Vuex from 'vuex';
import eventBus from '@/lib/event-bus.js';

import modules from './modules';

let reconnectInterval = null;
let heartbeatInterval = null;
let heartbeatMsg = '--heartbeat--';
let missedHeartbeat = 0
let intervalTime = 1000;  // 1 second

function websocketOnMessageHandler(message) {
    if (JSON.parse(message.data) == heartbeatMsg) {
        missedHeartbeat = 0;
    } else {
        let { event, data } = JSON.parse(message.data);
        eventBus.$emit(event, data);
    }
}

Vue.use(Vuex);

const state = {
	websocketConnection: null,
};

const mutations = {
	setWebsocketConnection(state, websocket) {
        state.websocketConnection = websocket;
    }
};

const actions = {
    async initiateWebsocketConnection({ commit, state, dispatch }) {
        if (state.websocketConnection) {
            return;
        }

        let token = await modules.Auth.actions.getWebsocketToken();

        if (!token) {
            return;
        }

        let protocol = API_URL === 'http://localhost:8000' ? 'ws://' : 'wss://';
        let host = API_URL.split('//')[1];
        console.log("lalalalallalalalalallalalalalalla"+protocol +
            host +
            '/websocket/desktop/' +
            '?token=' +
            token)

        const websocket = new WebSocket(
            protocol +
            host +
            '/websocket/desktop/' +
            '?token=' +
            token
        );

        websocket.addEventListener('open', event => {
            clearInterval(reconnectInterval);
            reconnectInterval = null;

            commit('setWebsocketConnection', websocket);
            eventBus.$emit('socket-connection-open')

            if (!heartbeatInterval) {
                missedHeartbeat = 0;
                heartbeatInterval = setInterval(() => {
                    try {
                        missedHeartbeat += 1;
                        if (missedHeartbeat >= 3) {
                            throw new Error('Heartbeat error');
                        }
                        websocket.send(heartbeatMsg);
                    } catch (e) {
                        clearInterval(heartbeatInterval);
                        heartbeatInterval = null;
                        commit('setWebsocketConnection', null);
                        state.websocketConnection = null;
                        reconnectInterval = setInterval(async () => {
                            await dispatch('initiateWebsocketConnection');
                        }, intervalTime);

                        eventBus.$emit('socket-connection-close');
                    }
                }, intervalTime);
            }
        });

        websocket.addEventListener('message', websocketOnMessageHandler);

        websocket.addEventListener('close', () => {
            commit('setWebsocketConnection', null);
        });
    }
};

modules['generics'] = {
    namespaced: true,
    state,
    mutations,
    actions
};

export default new Vuex.Store({
    modules,
    strict: process.env.NODE_ENV !== 'production'
});
