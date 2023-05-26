<script setup lang="ts">

import {PopoverPanel} from '@headlessui/vue';
import {onMounted, onUnmounted} from 'vue';

interface Props {
  panel: string | undefined;
}

defineProps<Props>();
const emit = defineEmits(['open', 'close']);

onMounted(() => {
  emit('open');
});
onUnmounted(() => {
  emit('close');
});
</script>

<template>
  <PopoverPanel
    v-slot="{open, close}"
    :class="[panel]"
    class="p-3 bg-ui-100 rounded-lg shadow-lg border border-solid border-ui-300"
  >
    <slot :open="open" :close="close" />
  </PopoverPanel>
</template>
