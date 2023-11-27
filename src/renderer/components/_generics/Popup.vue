<template>
    <div class="popup" @click.self="handleContainerClick">
        <div class="popup__content">
            <button
                v-if="!disableClose"
                class="popup__close"
                @click="$emit('close')"
            >
                <i class="mdi mdi-close"></i>
            </button>

            <header v-if="hasHeaderSlot" class="popup__header">
                <h2>
                    <slot name="header" />
                </h2>
            </header>

            <section class="popup__main">
                <slot>
                    <div v-html="message"></div>
                </slot>
            </section>

            <footer v-if="hasFooterSlot" class="popup__footer">
                <slot name="footer" />
            </footer>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'Popup',

        props: {
            message: {
                type: String,
                default: ''
            },
            disableClose: {
                type: Boolean,
                default: false
            }
        },

        computed: {
            hasHeaderSlot() {
                return !!this.$slots.header;
            },
            hasFooterSlot() {
                return !!this.$slots.footer;
            }
        },

        methods: {
            handleContainerClick() {
                if (!this.disableClose) {
                    this.$emit('close');
                }
            }
        }
    };
</script>

<style scoped>
    .popup {
        background-color: var(--black-secondary);
        display: flex;
        justify-content: center;
        align-items: center;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 5;
    }

    .popup__content {
        background-color: var(--white-primary);
        position: relative;
        display: flex;
        flex-direction: column;
        border-radius: 3px;
        max-width: 400px;
        padding-bottom: 12px;
        width: 100vw;
    }

    .popup__close {
        position: absolute;
        top: 16px;
        right: 16px;
        padding: 0;
        width: 20px;
        height: 20px;
        font-size: 14px;
        border-radius: 50%;
        color: var(--black-secondary);
    }

    .popup__close:hover {
        background-color: var(--error);
        color: var(--white-primary);
    }

    .popup__header {
        padding: 24px 24px 0;
        order: 1;
    }

    h2 {
        margin: 0;
        font-weight: bold;
        font-size: 80px;
    }

    .popup__main {
        padding: 24px 24px 12px;
        order: 2;
    }

    .popup__header ~ .popup__main {
        padding-top: 12px;
    }

    .popup__footer {
        display: flex;
        justify-content: flex-end;
        padding: 6px 24px 0;
        order: 3;
    }
</style>
