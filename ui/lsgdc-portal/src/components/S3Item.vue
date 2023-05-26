<template>
  <tr
    tabindex="0"
    class="h-11 p-2 cursor-pointer border border-solid border-transparent focus-visible:outline-0 focus-visible:border-primary-500 transition-none"
    :class="isSelected ? 'bg-primary-100 hover:bg-primary-100' : 'bg-ui-100 hover:bg-ui-200'"
    @click.exact="selectSingleS3Item"
    @click.ctrl.exact="selectS3Item"
    @click.meta.exact="selectS3Item"
    @click.shift.exact="rangeSelectS3Items"
    @mouseenter="isHovering = true"
    @dblclick="previewS3Item"
    @mouseleave="isHovering = false"
  >
    <td>
      <div
        class="flex items-center justify-start"
      >
        <component
          :is="icon" v-if="!isHovering && !isSelected"
          class="h-6 w-6 mx-1.5 text-ui-700"
        />
        <input
          v-else v-model="isSelected" type="checkbox"
          class="checkbox mx-2"
          @click.stop="selectS3Item"
        >
        <span
          class="text-base text-ui-800 hover:text-primary-500 hover:cursor-pointer active:text-primary-600 select-none mx-2"
          @click.self="previewS3Item"
        >{{ props.file.name }}</span>
        <div class="flex items-center justify-start gap-1">
          <p
            v-for="tag in file.tags" :key="tag" class="badge"
            :class="fileTypeBadge(tag)"
          >
            {{ tag }}
          </p>
        </div>
        <XPopover
          position="bottom-right"
          class="max-w-xs"
          panel="bg-transparent pt-0 px-0 shadow-none border-0"
          @open="openEditTags"
          @close="closeEditTags"
        >
          <PopoverButton
            :class="['btn btn-sm btn-borderless text-ui-700 hover:text-primary-500 transition-colors', file.tags.length > 0 ? 'btn-square p-0 ml-2' : '-ml-1', isHovering || isEditTagsOpen ? 'opacity-100' : 'opacity-0']"
            @click="selectSingleS3Item"
          >
            <p v-if="file.tags.length === 0">Add Tags</p>
            <PlusIcon v-else class="h-5 w-5" />
          </PopoverButton>

          <template #content="{close}">
            <XAutocomplete
              v-model="label"
              custom-value :options="labels"
              @auto-button="(b) => LabelButton = b"
            >
              <template #fallback="{active, selected, query}">
                <li
                  :class="['select-option', active ? 'bg-primary-100' : 'bg-ui-100']"
                  @click="close"
                >
                  <span
                    class="block truncate"
                    :class="{ 'font-medium text-primary-500': selected, 'font-normal': !selected }"
                  >
                    Add "{{ query }}"
                  </span>
                  <CheckIcon v-if="selected" class="select-option-icon" />
                </li>
              </template>
              <template #default="{selected, active, item}">
                <li
                  :class="['select-option', active ? 'bg-primary-100' : 'bg-ui-100']"
                  @click="close"
                >
                  <span
                    class="block truncate"
                    :class="{ 'font-medium text-primary-500': selected, 'font-normal': !selected }"
                  >
                    {{ item }}
                  </span>
                  <CheckIcon v-if="selected" class="select-option-icon" />
                </li>
              </template>
            </XAutocomplete>
          </template>
        </XPopover>
      </div>
    </td>
    <td>
      <span class="badge badge-gray mr-4 w-fit">{{
        humanFileSize(Number(props.file.size), true)
      }}</span>
    </td>
    <td class="w-0 whitespace-nowrap">
      <div class="flex gap-0.5 items-center w-fit -ml-2 mr-2">
        <div
          :class="['flex gap-0.5 items-center', isHovering || isEditTagsOpen ? 'opacity-100' : 'opacity-0']"
        >
          <button
            class="btn btn-sm btn-borderless btn-square text-ui-700 p-0 hover:text-primary-500"
          >
            <DocumentArrowDownIcon class="h-5 w-5" />
          </button>
          <!--          <button-->
          <!--            class="btn btn-sm btn-borderless btn-square text-ui-700 p-0 hover:text-primary-500"-->
          <!--            @click="renameS3Item"-->
          <!--          >-->
          <!--            <PencilSquareIcon class="h-5 w-5" />-->
          <!--          </button>-->
          <button
            class="btn btn-sm btn-borderless btn-square text-ui-700 p-0 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-950 active:bg-transparent"
            @click.stop="s3Store.deleteS3Item(file.rk)"
          >
            <TrashIcon class="h-5 w-5" />
          </button>
        </div>
        <button
          class="btn btn-sm btn-borderless btn-square text-ui-700 p-0 hover:text-primary-500"
        >
          <EllipsisVerticalIcon class="h-5 w-5" />
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import {computed, nextTick, Ref, ref} from 'vue';
import {useS3ItemStore} from '@/stores/s3ItemStore';
import {storeToRefs} from 'pinia';
import type {IS3Item} from '@/types/service-types';
import {humanFileSize} from '@/common/utils';
import {
  DocumentArrowDownIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  PhotoIcon,
  PlusIcon, CheckIcon
} from '@heroicons/vue/24/outline';
import XPopover from '@/components/gds2/XPopover.vue';
import {PopoverButton} from '@headlessui/vue';
import XAutocomplete from '@/components/gds2/XAutocomplete.vue';

interface Props {
  file: IS3Item;
  keyId: number;
}

const props = defineProps<Props>();

const s3Store = useS3ItemStore();
const {
  allSelected,
  isPreviewOpen,
  isRenameOpen,
  previewedS3Item,
  tagToColor,
  selectedS3Items,
  s3Items,
  previousSelection
} = storeToRefs(s3Store);

const isHovering = ref(false);
const isEditTagsOpen = ref(false);

const labels = ref(['Picture', 'Job', 'Identification', 'Receipt']);
const label: Ref<string | null> = ref(null);

const icon = computed(() => {
  const extension = props.file.name.split('.')[1];
  if (extension === 'png' || extension === 'jpg') return PhotoIcon;
  if (extension === 'mp3') return MusicalNoteIcon;
  else return DocumentTextIcon;
});


const isSelected = computed({
  get() {
    return selectedS3Items.value.includes(props.file);
  }, set(value: boolean) {
    const hasItem = selectedS3Items.value.includes(props.file);
    if (value && !hasItem) {
      selectedS3Items.value.push(props.file);
    }
    if (!value && hasItem) {
      const index = selectedS3Items.value.indexOf(props.file);
      selectedS3Items.value.splice(index, 1);
    }
    previousSelection.value = props.file;
    return hasItem;
  }
});

const previewS3Item = () => {
  isPreviewOpen.value = true;
  isEditTagsOpen.value = false;
  previewedS3Item.value = props.file;
};

const selectSingleS3Item = () => {
  s3Store.clearSelectedS3Items();
  isSelected.value = true;
  previousSelection.value = props.file;
  allSelected.value = false;
};

const selectS3Item = () => {
  isSelected.value = !isSelected.value;
  previousSelection.value = props.file;
};
const rangeSelectS3Items = () => {
  const previousIndex = previousSelection.value ? s3Items.value.indexOf(previousSelection.value) : 0;
  console.log(previousSelection.value, previousIndex);
  if (props.keyId < previousIndex) selectedS3Items.value = s3Items.value.slice(props.keyId, previousIndex + 1);
  else selectedS3Items.value = s3Items.value.slice(previousIndex, props.keyId + 1);
};
const renameS3Item = () => {
  isRenameOpen.value = true;
  previewedS3Item.value = props.file;
};

const LabelButton: Ref<HTMLElement | null> = ref(null);

const addTag = (tag: string | null) => {
  console.log(tag);
  // Use S3 store to update tags
  if (tag) s3Store.addTag(tag, props.file);
  isHovering.value = false;
};
const openEditTags = () => {
  isEditTagsOpen.value = true;
  nextTick(() => {
    LabelButton.value.el.click();
  });
};
const closeEditTags = () => {
  addTag(label.value);
  isEditTagsOpen.value = false;
  label.value = null;
};

const fileTypeBadge = (tag: string): string => {
  return tagToColor.value[tag];
};
</script>
