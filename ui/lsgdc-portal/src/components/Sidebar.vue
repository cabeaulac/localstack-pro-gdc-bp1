<template>
  <div
    class="flex flex-col items-start justify-between p-5 pt-0 z-[11] fixed h-screen w-72 overflow-y-scroll scrollbar-none bg-ui-100 border-r border-ui-300 col-start-1 col-end-2 row-start-1 row-end-3"
  >
    <div class="flex flex-col items-start gap-1 w-full">
      <router-link
        :to="{ name: 'Home' }"
        class="flex items-center justify-start w-full h-16 mb-2"
        tabindex="-1"
      >
        <h1
          class="text-2xl font-bold leading-none px-2"
        >
          LS-GDC-BP.
        </h1>
      </router-link>
      <router-link
        :to="{ name: 'Home' }" class="btn btn-sidebar"
      >
        <HomeIcon class="h-6 w-6 text-ui-700" />
        <span>Home</span>
      </router-link>

      <router-link
        :to="{ name: 'S3Store' }" class="btn btn-sidebar"
      >
        <LockClosedIcon class="h-6 w-6 text-ui-700" />
        <span>S3Store</span>
      </router-link>

      <router-link
        :to="{ name: 'User' }" class="btn btn-sidebar"
      >
        <UserIcon class="h-6 w-6 text-ui-700" />
        <span>User</span>
      </router-link>
    </div>
    <div class="flex flex-col w-full items-start gap-0.5">
      <button
        class="btn btn-sidebar"
        @click="logout"
      >
        <PowerIcon class="h-6 w-6 text-ui-700" />
        <span>Log Out</span>
      </button>
    </div>
    <slot />
  </div>
</template>

<script lang="ts" setup>
import {HomeIcon} from '@heroicons/vue/24/outline';
import {CalendarIcon} from '@heroicons/vue/24/outline';
import {ChartBarIcon} from '@heroicons/vue/24/outline';
import {BuildingLibraryIcon} from '@heroicons/vue/24/outline';
import {BanknotesIcon} from '@heroicons/vue/24/outline';
import {WrenchScrewdriverIcon} from '@heroicons/vue/24/outline';
import {MagnifyingGlassCircleIcon} from '@heroicons/vue/24/outline';
import {UsersIcon} from '@heroicons/vue/24/outline';
import {UserIcon} from '@heroicons/vue/24/outline';
import {LockClosedIcon} from '@heroicons/vue/24/outline';
import {ShieldCheckIcon} from '@heroicons/vue/24/outline';
import {PowerIcon} from '@heroicons/vue/24/outline';
import {useAuthStore} from '@/stores/auth';

const authStore = useAuthStore();
const {logout} = authStore;
</script>

<style scoped lang="postcss">
.btn-sidebar {
  @apply font-medium gap-3 text-sm px-2 -mx-2 translate-x-2 text-ui-900/90 w-full hover:bg-ui-200 whitespace-nowrap justify-start transition-none;
  scrollbar-width: none;
}

.btn-sidebar.router-link-exact-active {
  @apply bg-ui-200 -mr-4;
}

.btn-sidebar.router-link-exact-active span,
.btn-sidebar.router-link-exact-active svg {
  @apply text-primary-500;
}
</style>
