import sileo from '@/lib/sileo/restmodel.js';

const WorkforceEmployeeSettings = new sileo.Model('hqzen', 'workforce-employee-settings');
const WhitelistIPEmailSenderResource = new sileo.Model('hqzen', 'whitelist-ip-email-sender');

const actions = {
	fetchWorkforceEmployeeSettings(context, filters) {
		sileo.defaults.headers['IP'] = filters.ip_address;
		delete filters.ip_address;
		return WorkforceEmployeeSettings.objects.filter(filters);
	},

	createRequestToWorkRemotelyEmail(context, data) {
        const form = new FormData();

        form.append('employment_id', data.employment_id);
        form.append('ip_address', data.ip_address);

        return WhitelistIPEmailSenderResource.objects.create(form).then(response => {
            return response;
        }).catch( error => {
            console.error(error);
            return error;
        });
    }
}

export default {
	namespaced: true,
	actions
}
