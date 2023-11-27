<template>
    <div
        :class="['banner', `color-${color}`]"
    >
        <div>
            <div v-if="icon" class="icon">
                <i :class="[`mdi mdi-${icon}`, color]"></i>
            </div>
            <div class="content-main message">
                <p class="message__primary c-primary bold">
                    {{ primary }}
                </p>
                <p class="message__secondary c-secondary">
                    {{ secondary }}
                </p>
            </div>
        </div>
        <div class="content-right">
            <slot name="content-right" />
        </div>
    </div>
</template>

<script>
    export default {
        name: 'BannerAlert',
        props: {
            color: {
                type: String,
                required: true
            },

            primary: {
                type: String,
                required: true
            },

            secondary: {
                type: String,
                required: false
            },

            icon: {
                type: String,
                required: false
            }
        },
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .banner {
        display: grid;
        grid-template-columns: auto 0.5fr;
        justify-content: space-between;
        border-radius: 8px;
        min-height: 40px;
        padding: 6px 16px;
        background: $primary-highlight;

        > div {
            display: flex;
            align-items: center;

            .icon {
                display: flex;
                align-items: center;
                width: 36px;
                height: 36px;

                i {
                    font-size: 24px;
                    color: $secondary;
                }
            }
        }

        .content-right {
            display: flex;
            justify-content: flex-end;
        }

        .message {
            display: flex;
            flex-direction: column;
            padding: 4px;

            p {
                margin: 0;
                padding: 0;
            }
        }

        &.color {
            &-blue {
                background: $accent-highlight;
            }

            &-yellow {
                background: $warning-highlight;
            }

            &-red {
                background: $error-highlight;
            }


            &-green {
                background: $success-highlight;
            }
        }
    }
</style>
