<template>
    <div :class="['search', width]">
        <i class="mdi mdi-magnify"></i>
        <input
            v-if="!lazy"
            ref="searchInput"
            :placeholder="placeholder"
            :value="value"
            :class="size"
            :disabled="disabled"
            :style="'height: ' + height + 'px'"
            type="text"
            @input="$emit('input', $event.target.value)"
        />
        <input
            v-else
            ref="searchInput"
            :placeholder="placeholder"
            :value="value"
            :class="size"
            type="text"
            @change="$emit('input', $event.target.value)"
        />
        <Button
            class="iconic small tertiary"
            icon="close-circle"
            @click="clearHandler"
        />
    </div>
</template>

<script>
    import Button from '@/components/_generics/Button.vue';

    export default {
        name: 'SearchBar',

        components: {
            Button
        },

        props: {
            size: {
                type: String,
                required: false
            },

            placeholder: {
                type: String,
                required: false
            },

            value: {
                type: String,
                required: false
            },

            width: {
                type: String,
                required: false
            },

            lazy: {
                type: Boolean,
                default: false
            },

            disabled: {
                type: Boolean,
                default: false
            },
            height: {
                type: String,
                required: false
            }
        },

        watch: {
            disabled() {
                if (!this.disabled) {
                    this.$nextTick(() => {
                        this.$refs.searchInput.focus();
                    });
                }
            }
        },

        methods: {
            clearHandler() {
                this.$emit('input', '');
                this.$emit('clear');
            }
        }
    };
</script>

<style lang="scss" scoped>
    @import 'src/renderer/stylesheets/sass/abstract/variables.scss';
    @import 'src/renderer/stylesheets/sass/abstract/bpo-variables.scss';

    .search {
        display: inline-flex;
        position: relative;
        align-items: center;

        &.block {
            width: 100%;
        }

        i {
            font-size: 18px;
            position: absolute;
            padding-left: 16px;
            z-index: 1;
            color: $tertiary;
            background-color: $primary-container;
        }
    }

    input {
        position: relative;
        padding-left: 0;
        padding-right: 24px;
        width: 100%;
        text-indent: 50px;
        font-weight: 500;
        background: $primary-container;

        &:focus {
            padding-right: 24px;
        }
    }

    button {
        position: absolute;
        right: 4px;
    }
</style>
