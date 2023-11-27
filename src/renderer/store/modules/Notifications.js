import sileo from '@/lib/sileo/restmodel.js';

const Notification = new sileo.Model('applybpo', 'notification');

const actions = {
    fetchNotifications(context, filters) {
        return Notification.objects.filter(filters);
    }
};

export default {
    namespaced: true,
    actions,
};
