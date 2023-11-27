<template>
    <div v-click-outside="closeOptions" class="dropdown">
        <div
            class="selected input-control"
            :class="{ placeholder: selected == placeholder }"
            @click="toggleOptions"
        >
            {{ selected }}
        </div>
        <ul v-if="openOptions" class="options">
            <li v-if="options.length == 0" class="placeholder">
                {{ placeholder }}
            </li>
            <li
                v-for="(op, index) in options"
                :key="`options-${index}`"
                @click="select(op)"
            >
                {{ formatter(op) }}
            </li>
        </ul>
    </div>
</template>

<script>
    import { ClickOutside } from '@/directives/ClickOutside.js';

    export default {
        name: 'Dropdown',

        directives: {
            ClickOutside
        },

        props: {
            options: {
                type: Array,
                default() {
                    return [];
                }
            },

            placeholder: {
                type: String,
                default: 'Select an option'
            },

            formatter: {
                type: Function,
                default(e) {
                    return e;
                }
            }
        },

        data() {
            return {
                selected: this.placeholder,
                openOptions: false
            };
        },

        watch: {
            'options.length': {
                handler() {
                    if (this.options.length) {
                        this.select(this.options[0]);
                    }
                }
            }
        },

        methods: {
            select(option) {
                this.selected = this.formatter(option);
                this.openOptions = false;
                this.$emit('onSelection', option);
            },

            toggleOptions() {
                this.openOptions = !this.openOptions;
            },

            closeOptions() {
                this.openOptions = false;
            },
        },
    };
</script>

<style scoped>
    .dropdown {
        position: relative;
        user-select: none;
    }

    .selected {
        position: relative;
        text-transform: capitalize;
        text-overflow: ellipsis;
        white-space: nowrap;
        overflow: hidden;
        padding-right: 24px;
        width: calc(100% - (16px + 24px + 2px));
    }

    .placeholder {
        color: var(--black-disabled);
    }

    .selected::after {
        content: "";
        display: inline-block;
        position: absolute;
        top: 6px;
        right: 12px;
        bottom: 0;
        margin: auto 0;
        width: 0;
        height: 0;
        border: solid transparent;
        border-width: 7px 5px;
        border-top-color: var(--black-disabled);
    }

    .options {
        background-color: var(--white-primary);
        position: absolute;
        margin: 0;
        padding: 4px 0;
        top: calc(100% + 4px);
        left: 0;
        right: 0;
        max-height: 128px;
        list-style: none;
        border: 1px solid var(--black-border);
        border-radius: 4px;
        overflow-y: auto;
        opacity: 1;
        z-index: 1;
    }

    .options li {
        padding: 12px 12px;
        text-transform: capitalize;
    }

    .options li:not(.placeholder):hover {
        background-color: var(--primary-l95);
    }
</style>
