<template>
  <div
    class="fileitem-wrapper"
    :class="{
      'failed-border': file.status == 'failed',
      'success-border': file.status == 'success',
    }"
  >
    <!-- Upper -->
    <div class="flex flex-row justify-between">
      <span>{{ file.file.name }}</span>


      <span
        v-if="!file.percentage"
        class="material-symbols-outlined text-xl leading-none btn btn-sm btn-borderless btn-square text-ui-700 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-950 active:bg-transparent"
        @click="$emit('remove', file)"
      >
        delete</span>
    </div>
    <!-- Lower -->
    <div>
      <span v-if="file.status == 'failed'">
        <b class="failed">Failed</b>
      </span>
      <span v-if="file.status == 'success'">
        <b class="success">OK</b>
      </span>
      <span v-if="file.status == 'pending'">
        <b class="success">Pending</b>
      </span>
      <div class="fileitem-progress">
        <ProgressBar
          v-if="file.status == 'uploading'"
          :progress="file.percentage"
        />
        <span v-if="file.status == 'uploading'">
          <b> {{ file.percentage }}% </b>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type {UploadableFile} from '@/types/service-types';
import ProgressBar from '@/components/ProgressBar.vue';

interface Props {
  file: UploadableFile;
}

defineProps<Props>();

defineEmits(['remove']);

</script>

<style scoped lang="scss">
.fileitem-wrapper {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  border: 1px dashed lightgray;
  border-radius: 0.5rem;
  padding: 0.5rem;
}

.fileitem-progress {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.failed {
  color: red;
}

.success {
  color: green;
}

.failed-border {
  border-color: red;
}

.success-border {
  border-color: green;
}
</style>
