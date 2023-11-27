<template>
    <Popup
        :disable-close="disableClose"
        @close="$emit('close')"
    >
        <template slot="header">
            <i
                v-if="iconColor == 'warning'"
                :class="'mdi ' + icon + ' warning'"
            />
            <i
                v-if="iconColor == 'error'"
                :class="'mdi ' + icon + ' error'"
            />
        </template>

        <span v-html="message">
            {{ message }}
        </span>
        <br>
        <span
            v-if="showSecondary"
            class="secondary"
        >
            If you think this is wrong, please contact your employer.
        </span>
        <template
            v-if="showFooter"
            slot="footer"
        >
            <template v-if="!oneButton">
                <button
                    type="button"
                    name="yes"
                    class="yes-button"
                    @click="$emit('confirm')"
                >
                    YES
                </button>
                <button
                    type="button"
                    name="no"
                    class="no-button"
                    @click="$emit('close')"
                >
                    NO
                </button>
            </template>
            <template v-else>
                <button
                    type="button"
                    name="redirect"
                    class="redirect-button"
                    @click="$emit('redirect')"
                >
                    Go to ApplyBPO
                </button>
            </template>
        </template>
    </Popup>
</template>

<script>
    import Popup from '@/components/_generics/Popup.vue';

    export default {
        name: 'CustomPopup',

        components: {
            Popup
        },

        props: {
            message: {
                type: String,
                required: true
            },

            showSecondary: {
                type: Boolean,
                required: true
            },

            icon: {
                type: String,
                required: true
            },

            iconColor: {
                type: String,
                required: false,
                default: 'error'
            },

            showFooter: {
                type: Boolean,
                required: false,
                default: false,
            },

            disableClose: {
                type: Boolean,
                required: false,
                default: false,
            },

            oneButton: {
                type: Boolean,
                required: false,
                default: false,
            }
        },
    };
</script>

<style scoped>

    /deep/ .popup__content {
        max-width: 425px;
        width: 425px;
        max-height: 240px;
        height: 240px;
        padding: 0;
    }

    .warning {
        color: var(--warning);
    }

    .error {
        color: var(--error);
    }

    /deep/ .popup__header {
        font-size: 55px;
        padding-top: 12px;
        display: flex;
        justify-content: center;
        margin-top: 28px;
    }

    /deep/ .popup__main {
        font-size: 15px;
        text-align: center;
        padding-bottom: 20px;
    }

    .secondary {
        color: #72838c;
    }

    /deep/ .popup__footer {
        justify-content: center;
        padding: 0;
        height: 48px;
    }

    /deep/ .popup__footer button {
        width: 50%;
        border-radius: 0;
        color: white;
        font-size: 14px;
    }

    /deep/ .popup__footer .redirect-button {
        width: 100%;
        border-radius: 0;
        color: white;
        font-size: 14px;
    }

    .yes-button {
        background-color: var(--success)
    }

    .no-button {
        background-color: var(--error);
    }

    .redirect-button {
        background-color: var(--primary);
    }
</style>
