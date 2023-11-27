<template>
    <div id="app">
        <template v-if="$route.name != 'screenshot-notification'">
            <RestartAlertModal
                v-if="updateDownloaded"
                :sidebar-expand="isSidebarExpand"
            />

            <CustomPopup
                v-if="customPopupMessage"
                :message="customPopupMessage"
                icon="mdi-alert-circle"
                :show-secondary="false"
                icon-color="error"
                @close="customPopupMessage = ''"
            />
        </template>

        <router-view
            @switched-time="timedIn = $event"
            @sidebar-expand="isSidebarExpand = $event"
        />
    </div>
</template>

<script>
    import { ipcRenderer } from 'electron';
    import RestartAlertModal from '@/components/dashboard/RestartAlertModal.vue';
    import CustomPopup from '@/components/dashboard/CustomPopup.vue';

    export default {
        name: 'BposeatsDesktop',

        components: {
            RestartAlertModal,
            CustomPopup,
        },

        data() {
            return {
                updateDownloaded: false,
                isSidebarExpand: true,
                isOnline: null,
                offlineTime: null,
                customPopupMessage: '',
                timedIn: false
            };
        },

        created() {
            ipcRenderer.on('update-downloaded', (event) => {
                this.updateDownloaded = true;
            });

            // TODO: refactor implementation for Keep Me Signed In feature (jc@bposeats.com)
            // ipcRenderer.on('force-quit', () => {
            //     if (this.updateDownloaded) {
            //         ipcRenderer.send('quit-application', true);
            //     } else if (localStorage.getItem('current_employment')
            // && JSON.parse(localStorage.getItem('timedIn'))) {
            //         this.$router.push({name: 'tasks'});
            //         this.customPopupMessage = `<strong>CANNOT QUIT</strong> while timed in.
            //         Please <strong>TIME OUT</strong> first.`;
            //     } else {
            //         ipcRenderer.send('quit-application', JSON.parse(localStorage.getItem('rememberMeValue')));
            //     }
            // });

            window.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            window.addEventListener('drop', (e) => {
                e.preventDefault();
            });
        }
    };
</script>

<style>
    @import 'stylesheets/global.css';

    /* #app {
       font-family: 'Avenir', Helvetica, Arial, sans-serif;
       -webkit-font-smoothing: antialiased;
       -moz-osx-font-smoothing: grayscale;
       text-align: center;
       color: #2c3e50;
    } */

    #nav {
       padding: 30px;
    }

    #nav a {
       font-weight: bold;
       color: #2c3e50;
    }

    #nav a.router-link-exact-active {
       color: #42b983;
    }

    img {
        user-drag: none;
        user-select: none;
        -moz-user-select: none;
        -webkit-user-drag: none;
        -webkit-user-select: none;
        -ms-user-select: none;
    }
</style>
