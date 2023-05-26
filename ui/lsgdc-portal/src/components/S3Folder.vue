<template>
  <div
    tabindex="0"
    class="h-11 flex items-center rounded-lg p-2 hover:cursor-pointer hover:bg-ui-200 hover:border-ui-200 border border-solid border-ui-100 focus-visible:outline-0 focus-visible:border-primary-500 transition-none"
    @mouseenter="isHovering = true"
    @mouseleave="isHovering = false"
  >
    <input v-if="isHovering" type="checkbox" class="checkbox mr-4">
    <span v-else class="material-symbols-outlined mr-4 w-5">folder</span>
    <span
      class="text-base mr-2 text-ui-800 hover:text-primary-500 hover:cursor-pointer active:text-primary-600 select-none"
    >This is a folder</span>
    <template v-if="isHovering">
      <button
        class="btn btn-sm btn-borderless btn-square text-ui-700 hover:text-primary-500 ml-auto"
      >
        <span class="material-symbols-outlined">download</span>
      </button>
      <button
        class="btn btn-sm btn-borderless btn-square text-ui-700 hover:text-primary-500"
      >
        <span class="material-symbols-outlined text-xl leading-none">edit</span>
      </button>
      <button
        class="btn btn-sm btn-borderless btn-square text-ui-700 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-950 active:bg-transparent"
      >
        <span class="material-symbols-outlined text-xl leading-none">delete</span>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';

const isHovering = ref(false);
</script>
