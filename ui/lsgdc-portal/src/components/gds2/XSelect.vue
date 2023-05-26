<template>
  <Listbox v-model="selection" :name="name">
    <div class="relative w-full" :class="containerClass">
      <ListboxButton
        :id="id"
        class="select"
        v-bind="$attrs"
        :disabled="disabled"
      >
        <span v-if="icon" class="material-symbols-outlined select-icon-left">{{
          icon
        }}</span>{{
          selection || placeholder || "Select"
        }}
        <UnfoldMoreIcon :class="unfoldIconClass" :disabled="disabled" />
      </ListboxButton>
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="translate-y-1 opacity-0"
        enter-to-class="translate-y-0 opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="translate-y-0 opacity-100"
        leave-to-class="translate-y-1 opacity-0"
      >
        <ListboxOptions class="select-picker">
          <ListboxOption
            v-for="s in options"
            v-slot="{ active, selected }"
            :key="s"
            :value="s"
          >
            <slot :option="s" :active="active" :selected="selected">
              <li
                :class="[
                  'select-option',
                  active ? 'bg-primary-100' : 'bg-ui-100',
                  { 'font-medium text-primary-500': selected, 'font-normal': !selected }
                ]"
              >
                {{ s }}
                <CheckIcon v-if="selected" class="select-option-icon" />
              </li>
            </slot>
          </ListboxOption>
        </ListboxOptions>
      </transition>
    </div>
  </Listbox>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
};
</script>

<script setup lang="ts">
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue';
import UnfoldMoreIcon from '@/assets/gds2/icons/unfold_more/UnfoldMoreIcon.vue';
import {CheckIcon} from '@heroicons/vue/24/outline';
import {computed} from 'vue';

interface Props {
  modelValue: string | number | boolean | object | null;
  options: (string | number | boolean | object | null)[];
  placeholder?: string;
  icon?: string;
  disabled?: boolean;
  id?: string;
  unfoldIconClass?: string;
  containerClass?: string;
  name?: string;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:modelValue']);

const selection = computed({
  get() {
    return props.modelValue;
  },
  set(value: string | number | boolean | object | null) {
    emit('update:modelValue', value);
  },
});
</script>

<style lang="scss">
div:has(> .select-borderless) {
  display: inline-block;
}
</style>
