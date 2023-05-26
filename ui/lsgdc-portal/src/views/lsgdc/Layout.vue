<template>
  <div
    v-auto-animate="{duration: 150}"
    class="relative z-0 grid h-screen grid-cols-[18rem_1fr] grid-rows-[4rem_1fr] transition-[grid-template-columns]"
  >
    <Navbar />
    <Sidebar />
    <div
      class="@container relative scrollbar-none overflow-y-scroll px-8 bg-ui-100 col-start-2 col-end-3 row-start-2 row-end-3"
    >
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import {nextTick, onMounted} from 'vue';
import {storeToRefs} from 'pinia';
import {RouterView} from 'vue-router';
import Navbar from '@/components/NavBar.vue';
import Sidebar from '@/components/Sidebar.vue';
import {useAuthStore} from '@/stores/auth';
import {useUserStore} from '@/stores/userStore';
import {useSocketStore} from '@/stores/websocket';

const store = useAuthStore();
const {user, accessToken} = storeToRefs(store);

onMounted(async () => {
  console.log('Layout mounted start');

  document.documentElement.classList.add('no-transition'); // Disable transitions

  // init theme
  if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    localStorage.theme = 'dark';
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
    localStorage.theme = 'light';
  }

  document.documentElement.offsetHeight; // Trigger a reflow, flushing the CSS changes

  setTimeout(async () => { // 10ms pause to make certain no transitions are triggered
    await nextTick();
    document.documentElement.classList.remove('no-transition'); // Enable transitions
  }, 10);

  const userStore = useUserStore();
  userStore.retrieveUser();
  console.log('Layout mounted end');

  const sockStore = useSocketStore();
  sockStore.watchAuth();

});
</script>
