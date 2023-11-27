<template>
    <main class="signin-form">
        <div class="content">
            <header>
                <div class="logo">
                    <img src="@/assets/logo-time-tracker.svg" alt="ApplyBPO.com" />
                </div>
                <p v-if="errorMessage" class="error">
                    {{ errorMessage }}
                </p>
                <p v-else-if="warningMessage" class="warning">
                    {{ warningMessage }}
                </p>
                <p v-else>
                    Sign in to your ApplyBPO Account
                </p>
            </header>

            <form @submit.prevent="onSubmit">
                <input
                    v-model.trim="formData.username"
                    type="text"
                    placeholder="Email or username"
                    @keydown="errorMessage = ''"
                />

                <div class="password-inputField">
                    <FormField
                        v-model="formData.password"
                        :type="formData.type"
                        placeholder="Password"
                        input-class="large"
                        @keydown.enter.prevent="onSubmit"
                    />

                    <span
                        v-show="!showPasswordValue"
                        class="material-icons mdi mdi-eye-off"
                        @click="showPassword"
                    >
                    </span>

                    <span
                        v-show="showPasswordValue"
                        class="material-icons mdi mdi-eye"
                        @click="showPassword"
                    >
                    </span>
                </div>
                <button>Sign In</button>
            </form>

            <!-- TODO: refactor Keep me signed in implementation (jc@bposeats.com) -->
            <div v-if="false" class="check-and-forgot">
                <div class="remember-me custom-checkbox">
                    <input
                        id="remember-me"
                        v-model="rememberMeValue"
                        type="checkbox"
                    />
                    <label for="remember-me">Keep me signed in</label>
                </div>

                <a class="external-link" @click="forgotPassword">
                    Forgot your Password?
                    <i class="material-icons mdi mdi-launch"></i>
                </a>
            </div>

            <div class="product-by">
                A product of
                <img src="@/assets/logo-gray.png" alt="BPOSeats.com" />
            </div>
        </div>
    </main>
</template>

<script>
    import { mapState, mapActions } from 'vuex';
    import { ipcRenderer } from 'electron';
    import ExternalLinkMixin from '@/mixins/ExternalLinkMixin';
    import FormField from '@/components/_generics/FormField.vue';

    export default {
        name: 'SignInForm',
        components: {
            FormField,
        },

        mixins: [
            ExternalLinkMixin
        ],

        data() {
            return {
                formData: {
                    username: '',
                    password: '',
                    type: 'password'
                },
                errorMessage: '',
                warningMessage: '',
                isProcessing: false,
                rememberMeValue: null,
                showPasswordValue: false,
            };
        },

        computed: {
            ...mapState('Sites', ['sites']),
            ...mapState('generics', ['websocketConnection']),
        },

        watch: {
            rememberMeValue: {
                handler(value) {
                    localStorage.setItem('rememberMeValue', value);
                }
            }
        },

        created() {
            if (this.websocketConnection) {
                this.websocketConnection.close();
            }

            this.rememberMeValue = JSON.parse(localStorage.getItem('rememberMeValue')) ? true : false;
            let barData = {
                isTimedIn: false,
                hoursWorked: 0,
                totalEarnings: 0
            };
            ipcRenderer.send('send-bar-data-to-main', barData);
        },


        methods: {
            ...mapActions('Auth', ['performLogin']),

            async onSubmit() {
                this.isProcessing = true;
                this.errorMessage = '';
                this.warningMessage = '';

                if (this.formData.username.trim() && this.formData.password.trim()) {
                    const response = await this.performLogin(this.formData);
                    this.formData.password = '';

                    if (response.error) {
                        if (response.error.includes('invalid')) {
                            this.errorMessage = 'You entered a wrong username or password.';
                        } else {
                            this.errorMessage = response.error;
                        }
                    } else if (response.warning) {
                        this.warningMessage = response.warning.message;
                    } else {
                        this.$router.push({
                            name: 'select-employment'
                        });
                    }
                } else if (!this.formData.username.trim()) {
                    this.errorMessage = 'Please enter your username or email.';
                } else {
                    this.errorMessage = 'Please enter your password.';
                }
                this.isProcessing = false;
            },

            forgotPassword() {
                this.openExternalLink(this.sites.APPLYBPO_URL + '/password-reset');
            },

            showPassword() {
                if(this.formData.type === 'password') {
                    this.showPasswordValue = true;
                    this.formData.type = 'text';
                } else {
                    this.showPasswordValue = false;
                    this.formData.type = 'password';
                }
            },
        },
    };
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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

    .error.error {
        font-weight: 500;
        color: var(--error);
    }

    .warning {
        font-weight: 500;
        color: var(--warning);
    }

    form {
        margin-top: 16px;
    }

    input {
        display: block;
    }

    [type="password"] {
        margin-top: 8px;
    }

    button {
        background-color: var(--primary);
        display: block;
        margin-top: 16px;
        padding: 0;
        width: 100%;
        height: 40px;
        line-height: 40px;
        font-weight: bold;
        color: var(--white-primary);
    }

    .check-and-forgot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 12px;
        font-size: 12px;
    }

    .external-link {
        display: block;
        text-align: center;
        font-weight: 500;
        cursor: pointer;
    }

    .external-link i {
        display: inline-block;
        vertical-align: text-bottom;
        margin-left: 2px;
        font-size: 14px;
    }


    .custom-checkbox {
        position: relative;
    }

    .custom-checkbox [type="checkbox"] {
        position: absolute;
        top: 0;
        left: 0;
        opacity: 0;
    }

    .custom-checkbox label {
        position: relative;
        cursor: pointer;
        user-select: none;
    }

    .custom-checkbox label::before {
        content: "";
        display: inline-block;
        vertical-align: bottom;
        background-color: var(--white-primary);
        margin-right: 8px;
        width: 14px;
        height: 14px;
        border: 1px solid var(--black-border);
        border-radius: 4px;
        transition: background-color var(--transition);
    }

    .custom-checkbox [type="checkbox"]:checked + label::before {
        background-color: var(--primary);
    }

    .custom-checkbox label::after {
        content: "";
        display: block;
        position: absolute;
        top: 1px;
        left: 5px;
        width: 4px;
        height: 8px;
        border: solid var(--white-primary);
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
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

    .password-inputField {
        position: relative;
    }

    .mdi-eye-off, .mdi-eye {
        position: absolute;
        color: gray;
        right: 15px;
        top: 10px;
        cursor: pointer;
        font-size: larger;
    }
</style>
