import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            name: 'signin',
            component: require('@/pages/SignInForm').default
        },
        {
            path: '/select',
            name: 'select-employment',
            component: require('@/pages/SelectEmployment').default,
            meta: {
                loginRequired: true
            }
        },
        {
            path: '/dashboard',
            name: 'dashboard',
            component: require('@/pages/dashboard/Dashboard').default,
            meta: {
                loginRequired: true,
                currentEmploymentRequired: true
            },
            children: [{
                path: '/tasks',
                name: 'tasks',
                component: require('@/pages/dashboard/Tasks').default,
                meta: {
                    loginRequired: true,
                    currentEmploymentRequired: true
                }
            },
                {
                path: '/timelogs',
                name: 'timelogs',
                component: require('@/pages/dashboard/Timelogs').default,
                meta: {
                    loginRequired: true,
                    currentEmploymentRequired: true
                }
            },
            {
                path: '/voip',
                name: 'voip',
                component: require('@/pages/dashboard/Voip').default,
                meta: {
                    loginRequired: true,
                    currentEmploymentRequired: true
                }
            },
            {
                path: '/settings',
                name: 'settings',
                component: require('@/pages/dashboard/Settings').default,
                meta: {
                    loginRequired: true
                }
            }]
        }
    ]
});
