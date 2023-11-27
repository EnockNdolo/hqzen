<template>
    <div :class="['form-field' , {invalid: invalid}]">
        <label>
            {{ label }}
            <span v-if="required && label" class="red">*</span>
        </label>
        <label v-if="subtext">{{ subtext }}</label>
        <div class="input-wrapper">
            <BaseButton
                v-if="$attrs.type == 'date'"
                class="icon red highlight calendar-close"
                @click="clearDateHandler"
            >
                <i class="mdi mdi-close"></i>
            </BaseButton>
            <input
                :id="id"
                v-model="inputValue"
                v-bind="$attrs"
                :class="inputClass"
                :required="required"
                v-on="listeners"
                @focus="invalid = false"
                @invalid="invalidInputHandler"
            >
        </div>
    </div>
</template>

<script>
    import BaseButton from '@/components/_generics/BaseButton.vue';

    let counter = 0;

    export default {
        name: 'FormField',

        components: {
            BaseButton
        },

        inheritAttrs: false,

        props: {
            label: String,
            subtext: String,
            value: {
                type: [String, Number],
                required: true
            },
            id: {
                type: String,
                default() {
                    return `form-field-${counter++}`;
                }
            },
            inputClass: String,
            required: {
                type: Boolean,
                default: false
            },
            useDefaultAlert: {
                type: Boolean
            }
        },

        data() {
            return {
                invalid: false
            };
        },

        computed: {
            listeners() {
                const { ...listeners } = this.$listeners;
                delete listeners.input;
                return listeners;
            },

            inputValue: {
                get(){
                    return this.value;
                },

                set(value) {
                    this.$emit('input', value);
                }
            },
        },

        methods: {
            clearDateHandler() {
                this.$emit('input', '');
            },
            invalidInputHandler(e) {
                if (!this.useDefaultAlert) {
                    e.preventDefault();
                    this.invalid = true;
                    this.$emit('invalid');
                }
            }
        }
    };
</script>

<style scoped lang="scss">
    @import 'src/renderer/stylesheets/sass/abstract/variables.scss';
    @import 'src/renderer/stylesheets/sass/abstract/mixins.scss';

    .form-field,
    .form-inline {
        input[type=text],
        input[type=textarea],
        input[type=password],
        input[type=email],
        input[type=date],
        input[type=number],
        input[type=tel],
        input[type=time],
        textarea,
        .select-box {
            width: 100%;
        }
    }

    .blank {
        input[type=text],
        input[type=textarea],
        input[type=password],
        input[type=email],
        input[type=date],
        input[type=number],
        input[type=tel],
        input[type=time],
        textarea,
        .select-box {
            width: 100%;
            border-color: $red;
        }
    }


    .form-field {
        text-align: left;

        .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .input-wrapper .base-button{
            margin-right: 8px;
        }

        label {
            display: block;
            margin-bottom: 4px;
        }

        small {
            margin-top: 4px;
            font-size: 12px;
            color: $dark-gray;
        }

        &.no-label {
            label {
                margin-bottom: 0;
            }
        }

        &.row {
            display: flex;

            label {
                align-self: center;
                font-size: 14px;
                text-align: right;
                margin: 0;
                padding: 0 16px 0 0;
                width: 35%;

                @media #{$tablet} {
                    padding-right: 8px;
                }

                @media #{$mobile} {
                    font-size: 13px;
                    font-weight: normal;
                    text-align: left;
                    margin-bottom: 4px;
                    padding: 0;
                    width: 100%;
                }
            }

            .input-field {
                flex: 1;
            }

            @media #{$mobile} {
                display: block;
            }

            &.inline {
                @media #{$mobile} {
                    display: flex;
                }
            }
        }

        &.invalid {
            label,
            small {
                color: $red;
            }

            input,
            select {
                border-color: $red;
            }
        }

        &.valid {
            label,
            small {
                color: $green;
            }

            input,
            select {
                border-color: $green;
            }
        }
    }

    .form-inline {
        display: flex;

        input {
            flex: 1;
            & + button {
                margin-left: 8px;

                &:first-child {
                    margin: 0;
                }
            }
        }

        label {
            align-self: center;
            text-align: right;
            margin-right: 8px;
        }
    }

    .starting-date-picker {
        input[type=date] {
            border: none;
            padding-right: 4px;
        }
    }

    .calendar-close {
        position: absolute;
        right: 30px;
        width: 24px;
        height: 24px !important;

        i {
            font-size: 16px;
        }
    }
</style>
