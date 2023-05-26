<script setup lang="ts">
import {Popover, TransitionRoot} from '@headlessui/vue';
import {computed} from 'vue';
import XPopoverPanel from '@/components/gds2/XPopoverPanel.vue';

interface Props {
  position?: 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right' | 'left' | 'lower-left' | 'upper-left' | 'right' | 'lower-right' | 'upper-right';
  offset?: number | string;
  panel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  position: 'bottom',
  offset: 3,
  panel: ''
});
const emit = defineEmits(['open', 'close']);

const position = computed(() => {
  if (props.position === 'bottom-right') return '';
  if (props.position === 'bottom') return 'left-1/2 -translate-x-1/2';
  if (props.position === 'bottom-left') return 'right-0';
  if (props.position === 'lower-left') return 'top-0 right-full';
  if (props.position === 'left') return 'bottom-1/2 right-full translate-y-1/2';
  if (props.position === 'upper-left') return 'bottom-0 right-full';
  if (props.position === 'top-left') return 'bottom-full right-0';
  if (props.position === 'top') return 'bottom-full left-1/2 -translate-x-1/2';
  if (props.position === 'top-right') return 'bottom-full';
  if (props.position === 'upper-right') return 'bottom-0 left-full';
  if (props.position === 'right') return 'bottom-1/2 left-full translate-y-1/2';
  if (props.position === 'lower-right') return 'top-0 left-full';
  return '';
});

const offset = computed(() => {
  const offsetRem = Number(props.offset) / 4;
  if (props.position === 'bottom' || props.position === 'bottom-left' || props.position === 'bottom-right') return `${offsetRem}rem 0 0 0`;
  if (props.position === 'left' || props.position === 'upper-left' || props.position === 'lower-left') return `0 ${offsetRem}rem 0 0`;
  if (props.position === 'top' || props.position === 'top-left' || props.position === 'top-right') return `0 0 ${offsetRem}rem 0`;
  if (props.position === 'right' || props.position === 'upper-right' || props.position === 'lower-right') return `0 0 0 ${offsetRem}rem`;
  return `0 0 ${offsetRem}rem 0`;
});

</script>

<script lang="ts">
export default {
  inheritAttrs: false
};
</script>

<template>
  <Popover v-slot="{open, close}" class="relative">
    <slot :open="open" :close="close" />

    <TransitionRoot
      :show="open"
      as="div"
      :class="['popover-offset absolute z-10 w-screen max-w-fit', position]"
      v-bind="$attrs"
      enter="transition duration-200 ease-out"
      enter-from="translate-y-1 opacity-0"
      enter-to="translate-y-0 opacity-100"
      leave="transition duration-150 ease-in"
      leave-from="translate-y-0 opacity-100"
      leave-to="translate-y-1 opacity-0"
    >
      <XPopoverPanel
        :panel="panel" :position="position" @open="emit('open')"
        @close="emit('close')"
      >
        <slot name="content" :open="open" :close="close" />
      </XPopoverPanel>
    </TransitionRoot>
  </Popover>
</template>

<style lang="scss" scoped>
.popover-offset {
  padding: v-bind(offset);
}
</style>
