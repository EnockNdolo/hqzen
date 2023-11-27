<template>
    <main class="select-employment">
        <div class="content">
            <header>
                <div class="logo">
                    <img src="@/assets/logo-time-tracker.svg" alt="ApplyBPO.com" />
                </div>
                <p>Select Employment</p>
            </header>

            <form @submit.prevent="onContinue">
                <Dropdown
                    :options="activeEmployments"
                    :formatter="optionFormatter"
                    placeholder="Select an Employment"
                    @onSelection="selected = $event"
                />

                <!-- <select v-model="selected">
                    <option value="" disabled>
                        Select an Employment
                    </option>
                    <option
                        v-for="employment in activeEmployments"
                        :key="employment.pk"
                        :value="employment"
                    >
                        {{ employment.job_position }} at {{ employment.company_name }}
                    </option>
                </select> -->

                <button
                    :title="!selected ? 'Please select an Employment first' : ''"
                    :disabled="!selected"
                    @click="onContinue"
                >
                    Continue
                    <i class="material-icons mdi mdi-arrow-right"></i>
                </button>
            </form>

            <div class="product-by">
                A product of
                <img src="@/assets/logo-gray.png" alt="BPOSeats.com" />
            </div>
        </div>
    </main>
</template>

<script>
    import { mapState, mapActions, mapMutations } from 'vuex';
    import Dropdown from '@/components/_generics/Dropdown.vue';

    export default {
        name: 'SelectEmployment',

        components: {
            Dropdown,
        },

        data() {
            return {
                selected: '',
                activeEmployments: [],
            };
        },

        computed: {
            ...mapState('Auth', ['user']),
        },

        async created() {
            this.activeEmployments = await this.fetchActiveEmployments();
            document.addEventListener('keypress', this.handleEnterEvent);
        },

        destroyed() {
            document.removeEventListener('keypress', this.handleEnterEvent);
        },

        methods: {
            ...mapActions('Employment', ['fetchActiveEmployments']),
            ...mapMutations('Employment', ['setCurrentEmployment']),

            onContinue() {
                if (this.selected) {
                    this.setCurrentEmployment(this.selected);
                    this.$router.push({name: 'tasks'});
                }
            },

            optionFormatter(option) {
                return `${option.job_position} at ${option.company_name}`;
            },

            handleEnterEvent(e) {
                if (e.key == 'Enter') {
                    this.onContinue();
                }
            }
        },
    };
</script>

<style scoped>
    main {
        display: grid;
        height: 100vh;
    }

    .content {
        margin: auto;
        max-width: 320px;
        width: 100vw;
    }

    .logo {
        margin: 0 auto;
        height: 48px;
        width: max-content;
    }

    .logo img {
        height: 100%;
    }

    header p {
        margin: 12px 0 0;
        text-align: center;
        color: var(--black-secondary);
    }

    form,
    button {
        margin-top: 16px;
    }

    button {
        background-color: var(--primary);
        position: relative;
        display: block;
        padding: 0;
        width: 100%;
        height: 40px;
        line-height: 40px;
        font-weight: bold;
        color: var(--white-primary);
    }

    button i {
        position: absolute;
        top: 0;
        bottom: 0;
        right: 8px;
        margin: auto 0;
        height: max-content;
        font-size: 20px;
    }

    button[disabled] {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .product-by {
        position: absolute;
        right: 12px;
        bottom: 12px;
        font-size: 12px;
        color: var(--black-disabled);
    }

    .product-by img {
        display: inline-block;
        vertical-align: bottom;
    }
</style>
