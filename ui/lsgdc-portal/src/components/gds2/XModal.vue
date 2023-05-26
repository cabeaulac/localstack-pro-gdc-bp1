<template>
  <TransitionRoot appear :show="isOpen" as="template">
    <Dialog as="div" class="relative z-10" @close="isOpen = false">
      <TransitionChild
        as="template"
        enter="duration-300 ease-out"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="duration-200 ease-in"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-black bg-opacity-25 z-20 backdrop-blur"
        />
      </TransitionChild>

      <div class="fixed inset-0 overflow-y-auto z-30">
        <div
          class="relative flex min-h-full items-center justify-center p-4 text-center"
        >
          <TransitionChild
            as="template"
            enter="duration-300 ease-out"
            enter-from="opacity-0 scale-95"
            enter-to="opacity-100 scale-100"
            leave="duration-200 ease-in"
            leave-from="opacity-100 scale-100"
            leave-to="opacity-0 scale-95"
          >
            <DialogPanel
              class="transform overflow-y-visible rounded-lg bg-ui-100 p-6 z-40 text-left align-middle shadow-xl transition-all"
              :class="inheritedWidth"
              v-bind="$attrs"
            >
              <button
                class="btn btn-secondary btn-circle btn-sm absolute right-4 top-4 p-0"
                @click="isOpen = false"
              >
                <XMarkIcon class="h-4 w-4 stroke-2 text-ui-700" />
              </button>
              <DialogTitle
                v-if="title"
                as="h3"
                class="text-lg font-medium leading-6 text-ui-900 pb-2 mb-4"
              >
                {{ title }}
              </DialogTitle>
              <slot />
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script lang="ts">
export default {
  inheritAttrs: false
};
</script>

<script setup lang="ts">
import {computed, useAttrs} from 'vue';
import {
  TransitionRoot,
  TransitionChild,
  Dialog,
  DialogPanel,
  DialogTitle
} from '@headlessui/vue';
import {XMarkIcon} from '@heroicons/vue/24/outline';


interface Props {
  modelValue: boolean;
  title?: string;
}

const props = defineProps<Props>();


const attrs = useAttrs();

const inheritedWidth = computed(() => {
  if (!attrs.class) return 'w-5/12';
  const width = attrs.class.split(' ').find((value: string) => value.startsWith('w-', 0));
  return width || 'w-5/12';
});

const emit = defineEmits(['update:modelValue', 'close']);

const isOpen = computed({
  get() {
    return props.modelValue;
  },
  set(value: boolean) {
    emit('update:modelValue', value);
  }
});

</script>
