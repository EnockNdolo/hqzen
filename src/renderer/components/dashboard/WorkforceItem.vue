<template>
    <li
        class="workforce-item"
        :class="isSelected ? 'selected' : ''"
        @click="$emit('select-workforce', isSelected ? null : workforce.pk)"
    >
        <div>
            <div class="icon">
                <i class="mdi mdi-sitemap"></i>
            </div>
            <div>
                <p class="name">
                    {{ workforce.name }}
                </p>
            </div>
        </div>
        <Button
            v-if="isSelected"
            class="iconic rounded primary tiny check"
            icon="check"
        />
    </li>
</template>

<script>
    import Button from '@/components/_generics/Button.vue';

    export default {
        name: 'WorkforceItem',

        components: {
            Button,
        },

        props: {
            workforce: {
                required: true,
                type: Object,
            },

            isSelected: {
                type: Boolean,
                required: true,
            },
        },
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .workforce-item {
        @include clear-list-formatting();
        margin: 12px 0;

        > div {
            display: flex;
        }

        .icon {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        display: flex;
        align-items: center;
        padding: 8px;
        justify-content: space-between;
        background: $primary-container;
        border-radius: 4px;
        cursor: pointer;

        &-icon {
            background: $accent-container;
            display: flex;
            width: 40px;
            height: 40px;
            border-radius: 4px;
            margin-right: 12px;

            i {
                font-size: 22px;
                color: $accent;
            }
        }

        &.selected {
            background: $accent-highlight;
            // box-shadow: 0px 0px 1px 1px $accent;
            border: 1px solid $accent;
            border-radius: 4px;
        }
    }

    .name {
        margin-left: 16px;
    }

    .mdi {
        margin: 5px;
        font-size: 20px;
        color: var(--primary)
    }
</style>