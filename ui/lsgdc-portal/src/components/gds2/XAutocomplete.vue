<template>
  <Combobox v-model="selection" nullable>
    <div class="relative">
      <ComboboxButton
        ref="AutoButton"
        class="autocomplete flex items-center input transition"
      >
        <ComboboxInput
          class="indent-3 h-full w-full bg-ui-100 text-ui-800 focus-visible:outline-0"
          :display-value="(item: Object | string | number | null) => item && typeof item === 'object' ? item[property] : item"
          :placeholder="placeholder"
          autocomplete="off"
          @change="query = $event.target.value"
        />
        <UnfoldMoreIcon :disabled="false" />
      </ComboboxButton>
      <Transition
        enter-active-class="transition duration-100 ease-out"
        enter-from-class="transform scale-95 opacity-0"
        enter-to-class="transform scale-100 opacity-100"
        leave-active-class="transition duration-75 ease-out"
        leave-from-class="transform scale-100 opacity-100"
        leave-to-class="transform scale-95 opacity-0"
        @after-leave="query = ''"
      >
        <ComboboxOptions class="select-picker">
          <div
            v-if="filteredItems.length === 0 && query !== '' && !customValue"
            class="relative cursor-default select-none py-2 px-4 text-gray-700"
          >
            Nothing found.
          </div>
          <ComboboxOption
            v-if="query && customValue" v-slot="{ selected, active }"
            :value="query"
          >
            <slot
              name="fallback"
              :query="query" :custom-value="customValue"
              :selected="selected" :active="active"
            >
              <li
                :class="['select-option', active ? 'bg-primary-100' : 'bg-ui-100']"
              >
                <span
                  class="block truncate"
                  :class="{ 'font-medium text-primary-500': selected, 'font-normal': !selected }"
                >
                  Add "{{ query }}"
                </span>
                <CheckIcon v-if="selected" class="select-option-icon" />
              </li>
            </slot>
          </ComboboxOption>
          <ComboboxOption
            v-for="(item, index) in filteredItems"
            :key="index"
            v-slot="{ selected, active }"
            as="template"
            :value="item"
          >
            <slot
              :item="item" :index="index" :selected="selected"
              :active="active" :placeholder="placeholder" :property="property"
            >
              <li
                :class="['select-option', active ? 'bg-primary-100' : 'bg-ui-100']"
              >
                <span
                  class="block truncate"
                  :class="{ 'font-medium text-primary-500': selected, 'font-normal': !selected }"
                >
                  {{
                    !item ? placeholder : item && typeof item === 'object' ? item[property] : item
                  }}
                </span>
                <CheckIcon v-if="selected" class="select-option-icon" />
              </li>
            </slot>
          </ComboboxOption>
        </ComboboxOptions>
      </Transition>
    </div>
  </Combobox>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, Ref} from 'vue';
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
} from '@headlessui/vue';
import UnfoldMoreIcon from '@/assets/gds2/icons/unfold_more/UnfoldMoreIcon.vue';
import {CheckIcon} from '@heroicons/vue/24/outline';

interface Props {
  options: Array<{ [key: string]: any } | string | number | null>;
  modelValue: { [key: string]: any } | string | number | null;
  placeholder?: string;
  property?: string;
  customValue?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits(['update:modelValue', 'autoButton']);

const AutoButton: Ref<HTMLElement | null> = ref(null);
onMounted(() => {
  emit('autoButton', AutoButton.value);
});

const selection = computed({
  get() {
    return props.modelValue;
  },
  set(value: { [key: string]: any } | string | number | null) {
    emit('update:modelValue', value);
  },
});

const query = ref('');

const filteredItems = computed(() => {
  return query.value === ''
    ? props.options
    : props.options.filter((item) => {
        if (item && typeof item === 'object' && props.property) {
          return item[props.property]
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.value.toLowerCase().replace(/\s+/g, ''));
        } else {
          return String(item === null ? props.placeholder : item).toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.value.toLowerCase().replace(/\s+/g, ''));
        }
      }
    );
});
</script>

<style lang="postcss">
.autocomplete:has([data-headlessui-state="open"]) {
  @apply outline-0 border-primary-500 shadow-focus
}

.autocomplete > input::placeholder {
  @apply text-ui-700;
}
</style>
