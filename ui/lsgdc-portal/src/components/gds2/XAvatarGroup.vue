<template>
  <div class="flex items-center">
    <div v-if="usernames.length >= 1" class="p-0.5">
      <XAvatar :class="avatarClass" :username="usernames[0]" :dot="false" />
    </div>
    <div
      v-if="usernames.length >= 2"
      class="p-0.5 z-[1] bg-inherit rounded-full -ml-3"
    >
      <XAvatar :class="avatarClass" :username="usernames[1]" :dot="false" />
    </div>
    <div
      v-if="usernames.length >= 3"
      class="p-0.5 z-[2] bg-inherit rounded-full -ml-3"
    >
      <XAvatar :class="avatarClass" :username="usernames[2]" :dot="false" />
    </div>
    <div
      v-if="usernames.length >= 4"
      class="p-0.5 z-[3] bg-inherit rounded-full -ml-3"
    >
      <div
        :class="avatarClass"
        class="relative h-10 w-10 flex justify-center items-center bg-ui-100 border border-solid border-ui-300 rounded-full"
      >
        <p class="text-ui-800 pt-px">+{{ usernames.length - 3 }}</p>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import XAvatar from '@/components/gds2/XAvatar.vue';

interface Props {
  avatarClass?: string;
  usernames: string[];
}

defineProps<Props>();
</script>
