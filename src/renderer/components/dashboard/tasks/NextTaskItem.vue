<template>
    <li
        class="task-item"
        :class="isSelected ? 'task-item_active' : ''"
        @click="$emit('select-task', isSelected ? null : taskAssignment.pk)"
    >
        <p class="t-regular task-item_title">
            {{ taskAssignment.task.title }}
        </p>
        <div class="task-item_description">
            <p class="t-small bold">
                {{ taskAssignment.task.points }} points •&nbsp;
            </p>
            <p class="t-small card-name">
                {{ taskAssignment.task.card_title }}
            </p>
        </div>
    </li>
</template>

<script>
    export default {
        name: 'NextTaskItem',
        props: {
            taskAssignment: {
                type: Object,
                required: true
            },

            isSelected: {
                type: Boolean,
                required: true,
                default: false,
            }
        },
    };
</script>

<style lang="scss" scoped>
    @import '@/stylesheets/sass/abstract/bpo-variables.scss';

    .task-item {
        height: 57px;
        font-weight: 400;
        padding-left: 12px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        color: $secondary;
        cursor: pointer;
        border-bottom: 1px solid $quaternary;

        &_title {
            @include clamp-line(1);
        }

        &_description {
            display: flex;
            font-size: 12px;
            font-weight: bold;
            margin-top: 4px;

            .card-name {
                font-weight: 300;
                width: 220px;
                @include clamp-line(1);
            }

        }

        p {
            margin: 0;
            padding: 0;
        }

        &_active {
            background: $accent-container;
            border-top: 1px solid $accent;
            border-bottom: 1px solid $accent;
        }
    }
</style>
