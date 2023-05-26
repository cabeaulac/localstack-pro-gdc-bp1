<template>
  <Switch
    v-model="enabled"
    :class="enabled ? 'bg-primary-500' : 'bg-ui-300'"
    class="toggle group"
  >
    <span v-if="alt" class="sr-only">{{ alt }}</span>
    <span
      aria-hidden="true"
      :class="enabled ? 'translate-x-5' : 'translate-x-0'"
      class="toggle-dot group-disabled:shadow-none"
    />
  </Switch>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import { Switch } from '@headlessui/vue';

interface Props {
  modelValue?: boolean;
  // eslint-disable-next-line vue/require-default-prop
  alt?: string;
  checked?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  checked: false,
});

const emit = defineEmits(['update:modelValue']);
let enabled;
if (props.modelValue) {
  enabled = computed({
    get() {
      return props.modelValue;
    },
    set(value: boolean) {
      emit('update:modelValue', value);
    },
  });
} else if (!props.modelValue) {
  enabled = ref(props.checked);
}
</script>
