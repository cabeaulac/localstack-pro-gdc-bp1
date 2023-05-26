<template>
  <div ref="SegmentedControl" class="segmented-control">
    <template v-for="segment in segments" :key="segment">
      <input
        :id="segment" v-model="segmentValue" :value="segment"
        :checked="modelValue === segment" :name="name"
        type="radio"
      >
      <slot :segment="segment">
        <label :for="segment">{{ segment }}</label>
      </slot>
    </template>
  </div>
</template>

<script setup lang="ts">
import {computed, onMounted, Ref, ref, watch, watchEffect} from 'vue';

interface Props {
  modelValue: string;
  segments: string[];
  name: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);
const selectorTranslate = ref('translateX(0px)');
const SegmentedControl = ref<HTMLElement | null>(null);

function moveSelector(SegmentEl: HTMLElement, selection: string) {
  const labels = Array.from(SegmentEl?.children).filter(el => el.tagName.toLowerCase() === 'label');
  const selectedIndex = labels.map(el => el.getAttribute('for')).indexOf(selection);
  const labelWidth = labels[0].getBoundingClientRect().width;
  selectorTranslate.value = `translateX(${labelWidth * selectedIndex}px)`;
}

onMounted(() => {
  if (SegmentedControl.value) moveSelector(SegmentedControl.value, props.modelValue);
});

watchEffect(() => {
  if (SegmentedControl.value) moveSelector(SegmentedControl.value, props.modelValue);
});

const segmentValue = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
    if (SegmentedControl.value) moveSelector(SegmentedControl.value, value);
  }
});
</script>

<style scoped lang="scss">
.segmented-control :deep(label:first-of-type::before) {
  transform: v-bind(selectorTranslate);
}
</style>
