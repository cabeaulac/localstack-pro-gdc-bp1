<template />

<script lang="ts" setup>
import {onMounted} from 'vue';
import {useAuthStore} from '@/stores/auth';

const authStore = useAuthStore();

onMounted(async () => {
  console.log('Auth0Callback handling callback');
  await authStore.createClient();
  await authStore.handleCallback();
});
</script>

