import sileo from '@/lib/sileo/restmodel.js';

const UploadScreenshotsAmazon = new sileo.Model('applybpo', 'upload-screenshots-amazon-form');
const Screenshot = new sileo.Model('timelogging', 'screenshot');

const actions = {
    async fetchUploadScreenshotsAmazon({commit}, filters) {
        let data = await UploadScreenshotsAmazon.objects.filter(filters);
        return data.amazon;
    },

    createScreenshot(context, data){
        const form = new FormData();

        for (let field in data) {
            let value = data[field];
            if (field == 'keys') {
                value = JSON.stringify(value);
            }
            form.append(field, value);
        }

    	return Screenshot.objects.create(form).then( response => {
            return response;
        }).catch( response => {
            console.error(response);
            return response;
        });
    }
};

export default {
    namespaced: true,
    actions,
};
