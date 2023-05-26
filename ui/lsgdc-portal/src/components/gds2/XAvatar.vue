<template>
  <div
    class="relative h-10 w-10 flex justify-center items-center bg-primary-100 text-primary-500 border border-solid border-primary-200 rounded-full"
  >
    <UserIcon
      v-if="noInitials"
      class="h-4 w-4 text-primary-500 font-size-inherit"
    />
    <span
      v-else-if="username === 'Lead Machine'"
      class="material-symbols-outlined text-primary-500"
    >smart_toy</span>
    <p v-else class="text-primary-500 pt-px">{{ initials }}</p>
    <div
      v-if="username !== 'LS GDC' && dot"
      class="absolute h-3 w-3 border-2 border-solid border-ui-100 rounded-full bg-green-500 -bottom-px -right-px"
    />
  </div>
</template>

<script setup lang="ts">
import {UserIcon} from '@heroicons/vue/24/solid';
import {useAuthStore} from '@/stores/auth';
import {computed} from 'vue';

interface Props {
  // eslint-disable-next-line vue/require-default-prop
  username?: string;
  dot?: boolean;
  noInitials?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  dot: true,
});

const auth = useAuthStore();
const initials = computed(() => {
  console.log(props.username);
  if (props.username) return `${props.username.split(' ')[0]?.[0].toUpperCase()}${props.username.split(' ').at(-1)?.[0].toUpperCase()}`;
  return `${auth.user?.given_name?.[0].toUpperCase()}${auth.user?.family_name?.[0].toUpperCase()}`;
});

</script>
