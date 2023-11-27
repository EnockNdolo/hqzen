import psList from 'ps-list';
import {mapActions, mapGetters} from 'vuex';

export default {
    name: 'AutoClickerMixin',

    data () {
        return {
            autoClickerDetected: false,
        }
    },

    computed: {
        ...mapGetters('AutoClickers', ['autoClickersList']),
        ...mapGetters('Employment', ['currentEmployment']),

        filteredAutoClickersList() {
            return this.autoClickersList.map((item) => {
                return {
                    name: item.name.replace(/\s+/g,
                        '').replace(/[^a-zA-Z ]/g, "").toLowerCase(),
                    pk: item.pk
                }
            });
        }
    },

    methods: {
        ...mapActions('AutoClickers', ['createAutoClickerEmail']),

        handleAutoClickerDetection() {
            const processList = (async () => {
                let processesList = await psList();
                let processesListNames = [];

                for (process of processesList) {
                    if (process.name.includes('.exe')) {
                        process.name = process.name.slice(0, -4);
                    }
                    let refinedProcessName = process.name.replace(/[^a-zA-Z ]/g, "").toLowerCase()
                    if (!(processesListNames.includes(refinedProcessName))) {
                        processesListNames.push(refinedProcessName);
                    }
                }

                let detectedAutoClickers = this.filteredAutoClickersList.filter(autoClicker => {
                    return processesListNames.includes(autoClicker.name);
                });

                if (detectedAutoClickers && !this.autoClickerDetected) {
                    let data = {
                        'employment_id': this.currentEmployment.pk,
                        'auto_clicker_id': detectedAutoClickers[0].pk
                    }
                    this.createAutoClickerEmail(data);
                    this.autoClickerDetected = true;
                }
            })();
        }
    }
}