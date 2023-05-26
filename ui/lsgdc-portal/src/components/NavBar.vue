<script lang="ts" setup>
import XAvatar from '@/components/gds2/XAvatar.vue';
import XToggle from '@/components/gds2/XToggle.vue';
import {useUIStore} from '@/stores/gds/uiStore';
import {storeToRefs} from 'pinia';
import {MagnifyingGlassIcon} from '@heroicons/vue/24/outline';
import {PowerIcon} from '@heroicons/vue/24/outline';
import {Cog6ToothIcon} from '@heroicons/vue/24/outline';
import {ChevronDownIcon} from '@heroicons/vue/24/outline';
import {UserIcon} from '@heroicons/vue/24/outline';
import {MoonIcon} from '@heroicons/vue/24/outline';
import {useAuthStore} from '@/stores/auth';
import {computed} from 'vue';
import {Menu, MenuButton, MenuItem, MenuItems} from '@headlessui/vue';

const uiStore = useUIStore();
const {toggleTheme} = uiStore;
const {theme} = storeToRefs(uiStore);

const authStore = useAuthStore();
const {user} = storeToRefs(authStore);
const authName = computed(() => `${user.value?.given_name} ${user.value?.family_name}`);
</script>

<template>
  <nav
    class="sticky w-full z-10 grid grid-cols-[1fr_auto] gap-3 items-center shadow-sm border-b border-solid border-ui-300 bg-ui-100 h-16 col-start-2 col-end-3 row-start-1 row-end-2"
  >
    <div class="w-5/6 ml-8 flex items-center justify-start gap-3">
      <MagnifyingGlassIcon class="h-5 w-5 text-ui-700" />
      <input
        type="text"
        class="p-0 justify-self-start input bg-inherit border-0 indent-0 focus-visible:ring-0 focus-visible:shadow-none"
        placeholder="Search..."
      >
    </div>
    <Menu as="div" class="relative inline-block text-left">
      <MenuButton>
        <div
          class="flex items-center gap-3 mr-8 justify-self-end cursor-pointer"
        >
          <XAvatar class="h-8 w-8 text-xs" no-initials :dot="false" />
          <p class="text-sm font-medium">{{ authName }}</p>
          <ChevronDownIcon
            class="h-4 w-4 text-ui-700 mt-0.5 stroke-2"
          />
        </div>
      </MenuButton>
      <transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="-translate-y-1 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="-translate-y-1 opacity-0"
      >
        <MenuItems
          class="absolute right-0 mt-2 mr-4 w-56 origin-top-right divide-y divide-ui-300 rounded-lg bg-ui-100 border border-solid border-ui-300 shadow-lg focus:outline-none"
        >
          <div class="p-1">
            <MenuItem>
              <div
                class="flex text-sm items-center justify-start h-8 px-2 rounded-lg select-none"
              >
                <MoonIcon class="mr-2 h-5 w-5 text-ui-700" />
                Dark Mode
                <XToggle
                  class="ml-auto" :checked="theme === 'dark'"
                  @click="toggleTheme"
                />
              </div>
            </MenuItem>
          </div>
          <div class="p-1">
            <MenuItem>
              <button
                class="btn btn-sm gap-0 py-4 w-full justify-start hover:bg-ui-200"
              >
                <UserIcon class="mr-2 h-5 w-5 text-ui-700" />
                Profile
              </button>
            </MenuItem>
            <MenuItem>
              <button
                class="btn btn-sm gap-0 py-4 w-full justify-start hover:bg-ui-200"
              >
                <Cog6ToothIcon class="mr-2 h-5 w-5 text-ui-700" />
                Settings
              </button>
            </MenuItem>
          </div>

          <div class="p-1">
            <MenuItem>
              <button
                class="btn btn-sm gap-0 py-4 w-full justify-start hover:bg-ui-200"
              >
                <PowerIcon class="mr-2 h-5 w-5 text-ui-700" />
                Log Out
              </button>
            </MenuItem>
          </div>
        </MenuItems>
      </transition>
    </Menu>
  </nav>
</template>
