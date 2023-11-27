<template>
    <div>
        <header class="main-title sticky">
            <h1>Voip</h1>
        </header>

        <CallQueue />
        <CallDetails />
        <CustomerInformation />
    </div>
</template>

<script>
    import CallQueue from '@/components/dashboard/voip/CallQueue.vue';
    import CallDetails from '@/components/dashboard/voip/CallDetails.vue';
    import CustomerInformation from '@/components/dashboard/voip/CustomerInformation.vue';

    export default {
        name: 'Voip',

        components: {
            CallQueue,
            CallDetails,
            CustomerInformation,
        },
    };
</script>
