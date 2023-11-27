<template>
    <AlertModal
        color="blue"
        size="tiny"
        message-primary="Select Workforce"
    >
        <template slot="details">
            <ul class="workforce-list">
                <WorkforceItem
                    v-for="workforce in workforces"
                    :key="`workforce-${workforce.pk}`"
                    :workforce="workforce"
                    :is-selected="workforce.pk == selectedWorkforceId"
                    :class="isSelected ? 'selected' : ''"
                    @select-workforce="selectedWorkforceId = $event"
                    @click="isSelected = !isSelected"
                />
            </ul>
        </template>
        <template slot="footer">
            <div class="footer-stack">
                <Button
                    class="primary bold large block"
                    @click="$emit('close', selectedWorkforceId)"
                >
                    Select
                </Button>
                <Button
                    class="highlight secondary bold large block"
                    @click="$emit('close')"
                >
                    Cancel
                </Button>
            </div>
        </template>
    </AlertModal>
</template>

<script>
    import AlertModal from '@/components/_generics/AlertModal.vue';
    import Button from '@/components/_generics/Button.vue';
    import WorkforceItem from '@/components/dashboard/WorkforceItem.vue';

    export default {
        name: 'SelectWorkforceModal',

        components: {
            AlertModal,
            Button,
            WorkforceItem,
        },

        props: {
            workforces: {
                type: Array,
                required: true
            },

            currentWorkforceId: {
                type: Number,
                required: false,
                default: -1
            }
        },


        data() {
            return {
                selectedWorkforceId: null,
                isSelected: false
            };
        },

        created() {
            this.selectedWorkforceId = this.currentWorkforceId;
        },
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .workforce-item {

        > div {
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
            border: 1px solid $accent;
            border-radius: 4px;
        }
    }

    .workforce-list {
        @include clear-list-formatting();
    }

</style>
