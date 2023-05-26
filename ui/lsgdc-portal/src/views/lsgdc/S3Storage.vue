<template>
  <div
    class="sticky top-0 z-10 bg-ui-100 flex items-center justify-between pt-4 pb-7"
  >
    <h3 class="text-xl font-semibold text-ui-900">S3 Storage</h3>
    <div class="flex items-center">
      <Menu as="div" class="relative inline-block text-left">
        <MenuButton class="btn btn-md btn-primary">
          Create
          <PlusIcon class="h-4 w-4 text-white stroke-2" />
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
            class="absolute z-20 right-0 mt-2 w-56 origin-top-right divide-y divide-ui-300 rounded-lg bg-ui-100 border border-solid border-ui-300 shadow-lg focus:outline-none"
          >
            <div class="p-1">
              <MenuItem disabled @click="isAddFolderOpen = true">
                <button
                  disabled
                  class="btn btn-sm gap-0 py-4 w-full justify-start cursor-not-allowed bg-ui-200/60 text-ui-700 disabled:bg-ui-200 disabled:hover:bg-ui-200/50 disabled:text-ui-700"
                >
                  <FolderPlusIcon class="mr-2 h-5 w-5 text-ui-700/50" />
                  New Folder
                </button>
              </MenuItem>
              <MenuItem @click="isAddFileOpen = true">
                <button
                  class="btn btn-sm gap-0 py-4 w-full justify-start hover:bg-ui-200"
                >
                  <DocumentPlusIcon class="mr-2 h-5 w-5 text-ui-700" />
                  Add Files
                </button>
              </MenuItem>
            </div>
          </MenuItems>
        </transition>
      </Menu>
      <button
        class="btn btn-borderless bg-ui-100 hover:bg-ui-100 pl-1.5 pr-0 ml-1 active:bg-ui-100"
      >
        <XAvatarGroup
          avatar-class="h-7 w-7 text-xs" class="bg-inherit"
          :usernames="['Ya Boi', 'Xander B', 'Xander B', 'Xander B']"
        />
      </button>
    </div>
  </div>
  <table class="relative w-full whitespace-nowrap">
    <thead>
      <tr
        class="sticky shadow-[inset_0_-1px_0] shadow-ui-300 top-[5.25rem] bg-ui-100"
      >
        <th
          scope="col"
          class="text-sm font-medium text-start pb-3"
        >
          <div class="flex items-center gap-2 justify-start">
            <input
              v-model="allSelected" type="checkbox"
              class="checkbox mx-2"
              @click="selectAllS3Items"
            >
            Name
          </div>
        </th>
        <th
          scope="col"
          class="text-sm font-medium text-start pb-3"
        >
          File Size
        </th>
        <th
          scope="col"
          class="text-sm font-medium text-start pb-3 w-auto"
        />
      </tr>
    </thead>
    <tbody>
      <S3Item
        v-for="(file, id) in s3Items" :key="file.rk"
        :file="file" :key-id="id"
      />
    </tbody>
  </table>
  <XModal
    v-model="isPreviewOpen" class="w-auto h-3/4"
    :title="previewedS3Item?.name"
  >
    <div class="grid grid-cols-[auto,_1fr] gap-6">
      <div
        class="h-[70vh] w-[54vh] rounded-lg bg-ui-200 text-ui-800 flex items-center justify-center"
      >
        File preview will be here...
        <br> It's already in 8.5" by 11" format!
      </div>
      <div class="flex flex-col gap-3">
        <div class="form-input">
          <label class="form-label">Title</label>
          <input
            v-model="title" type="text"
            class="input input-sm input-hybrid"
          >
        </div>
        <div class="form-input">
          <label class="form-label">Description</label>
          <XEditor
            v-slot="{ editor }" v-model="title"
            placeholder="Add a description"
            class="border-ui-100 px-1.5 -mx-1.5 pt-0.5 -mt-0.5 hover:bg-ui-200 active:bg-ui-100"
            editor-content-class="p-0"
            :editor-toolbar-class="descEditorFocused ? 'flex px-1.5 pt-1.5' : 'h-[2.875rem] px-1.5 pt-1.5'"
            @focused="(bool) => descEditorFocused = bool"
          >
            <TransitionRoot
              :show="descEditorFocused" as="div" class="flex w-full"
              enter="transition" enter-from="opacity-0"
              enter-to="opacity-100" leave="transition"
              leave-from="opacity-100" leave-to="opacity-0"
            >
              <XEditorButton :editor="editor" type="bold" />
              <XEditorButton :editor="editor" type="italic" />
              <XEditorButton :editor="editor" class="ml-auto" type="@" />
            </TransitionRoot>
          </XEditor>
        </div>
        <div class="flex gap-3 mt-auto items-center justify-end">
          <button class="btn btn-borderless">Cancel</button>
          <button class="btn btn-primary">Save</button>
        </div>
      </div>
    </div>
  </XModal>
  <XModal v-model="isAddFolderOpen" title="New Folder" class="max-w-md">
    <input v-focus class="input mb-6" type="text">
    <div class="flex gap-3 items-center justify-end">
      <button class="btn btn-borderless" @click="isAddFolderOpen = false">
        Cancel
      </button>
      <button class="btn btn-primary" @click="isAddFolderOpen = false">
        Create
      </button>
    </div>
  </XModal>
  <XModal v-model="isRenameOpen" title="Rename File" class="max-w-md">
    <input v-model="title" v-focus class="input mb-6" type="text">
    <div class="flex gap-3 items-center justify-end">
      <button class="btn btn-borderless" @click="isRenameOpen = false">
        Cancel
      </button>
      <button class="btn btn-primary" @click="saveTitle">Save</button>
    </div>
  </XModal>

  <XModal v-model="isAddFileOpen" title="Add Files" class="max-w-md">
    <S3Upload />
  </XModal>
</template>

<script setup lang="ts">
import S3Item from '@/components/S3Item.vue';
import {useS3ItemStore} from '@/stores/s3ItemStore';
import {storeToRefs} from 'pinia';
import XModal from '@/components/gds2/XModal.vue';
import XEditor from '@/components/gds2/XEditor.vue';
import {
  Menu, MenuButton, MenuItem,
  MenuItems,
  TransitionRoot
} from '@headlessui/vue';
import XEditorButton from '@/components/gds2/XEditorButton.vue';
import {computed, onBeforeMount, onBeforeUnmount, onMounted, ref} from 'vue';
import XAvatarGroup from '@/components/gds2/XAvatarGroup.vue';
import S3Upload from '@/views/lsgdc/S3Upload.vue';
import {
  DocumentPlusIcon, FolderPlusIcon, PlusIcon
} from '@heroicons/vue/24/outline';

const s3Store = useS3ItemStore();
const {
  allSelected,
  s3Items,
  isPreviewOpen,
  isAddFolderOpen,
  isRenameOpen,
  previewedS3Item,
  isAddFileOpen,
  selectedS3Items
} = storeToRefs(s3Store);

const title = ref(previewedS3Item.value?.desc);
const saveTitle = () => {
  s3Items.value[previewedS3Item.value?.id].desc = title.value;
  isRenameOpen.value = false;
};
const desc = computed(() => previewedS3Item.value?.desc || null);
const descEditorFocused = ref(false);


onMounted(() => {
  s3Store.getTagToColor();
});

onBeforeMount(async () => {
  // Refresh S3 items
  s3Store.loadS3Items();
  // Register for contact changes
  s3Store.registerForWsEvents();
});

onBeforeUnmount(async () => {
  s3Store.unregisterForWsEvents();
});
const selectAllS3Items = () => {
  if (!allSelected.value) selectedS3Items.value = s3Items.value.slice(0);
  if (allSelected.value) s3Store.clearSelectedS3Items();
};
</script>
