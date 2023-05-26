<template>
  <svg
    width="8"
    height="8"
    viewBox="0 0 8 8"
    :class="['select-icon', disabled ? 'fill-white-disabled' : 'fill-white']"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="4" cy="4" r="4" />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  disabled: boolean;
}
defineProps<Props>();
</script>
