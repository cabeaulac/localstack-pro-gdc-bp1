<template>
  <section class="flex flex-col items-center">
    <DropZone
      class="text-center w-full"
      @files-dropped="addFiles"
    >
      <label
        for="file-input"
        class="cursor-pointer mt-2 flex justify-center rounded-lg border border-dashed hover:bg-ui-200/60 border-ui-900/25 px-6 py-10 transition-colors"
      >
        <span class="block text-center">
          <PhotoIcon class="mx-auto h-12 w-12 text-ui-700" />
          <span
            class="mt-4 flex items-center text-sm leading-6 text-ui-800"
          >
            <span class="font-semibold">Click to upload</span>
            <span class="pl-1">or drag and drop</span>
          </span>
          <span class="text-xs leading-5 text-ui-700">PNG, JPG, GIF up to 10MB</span>
        </span>
        <input
          id="file-input" class="sr-only" type="file" multiple
          @change="onInputChange"
        >
      </label>
    </dropzone>
  </section>
</template>

<script setup lang="ts">
import FilesService from '@/common/files-service';
import {storeToRefs} from 'pinia';
import DropZone from '@/components/DropZone.vue';
import {UploadableFile, S3SignedUrlData} from '@/types/service-types';
import type {Ref} from 'vue';
import {ref} from 'vue';
import {useS3ItemStore} from '@/stores/s3ItemStore';
import {PhotoIcon} from '@heroicons/vue/24/solid';

const s3Store = useS3ItemStore();
const {selectedFiles, isAddFileOpen} = storeToRefs(s3Store);
const uploading: Ref<boolean> = ref(false);
const uploadingDone: Ref<boolean> = ref(false);

function addFiles(newFiles: File[]) {
  const newUploadableFiles = [...newFiles]
    .map((file) => new UploadableFile(file))
    .filter((file) => !s3Store.fileExists(file.id));
  selectedFiles.value = selectedFiles.value.concat(newUploadableFiles);
  console.log('uploading files');
  uploadFiles();
  isAddFileOpen.value = false;
}

function onInputChange(e: any) {
  addFiles(e.target.files);
  e.target.value = null; // reset so that selecting the same file again will still cause it to fire this change
}

function doUploadToS3(data: S3SignedUrlData, file: UploadableFile): Promise<boolean> {
  console.log('perform file upload for ', file.file.name);
  file.status = 'uploading';
  uploading.value = true;
  const progressHandler = (event: any) => {
    selectedFiles.value[data.index].percentage = Math.round(
      (100 * event.loaded) / event.total
    );
  };
  return FilesService.upload(data, file.file, progressHandler)
    .then((response) => {
      const prevMessage = selectedFiles.value[data.index].message
        ? selectedFiles.value[data.index].message + '\n'
        : '';
      if (response.data.message != undefined) {
        selectedFiles.value[data.index].message =
          prevMessage + response.data.message;
      }
      selectedFiles.value[data.index].status = 'success';
      uploading.value = false;
      return true;
    })
    .catch(() => {
      selectedFiles.value[data.index].status = 'failed';
      selectedFiles.value[data.index].percentage = 0;
      selectedFiles.value[data.index].message =
        'Could not upload the file:' + file.file.name;
      uploading.value = false;
      return Promise.reject(data.index);
    });
}

async function uploadFiles() {
  const presignedArray = await s3Store.s3UploadUrls(
    selectedFiles.value.map((f, index) => ({
      name: f.file.name,
      type: f.file.type,
      path: f.path,
      index
    })));
  console.log('presignedArray: ', presignedArray);
  uploading.value = true;
  uploadingDone.value = false;
  const uploadPromises = (presignedArray.data ?? []).map((s3) => {
      doUploadToS3(s3, selectedFiles.value[s3.index]);
    }
  );

  Promise.all(uploadPromises)
    .then(() => {
      // contactStore.clearFiles();
      uploadingDone.value = true;
    })
    .catch((e) => {
      return Promise.reject(e);
    })
    .finally(() => {
      uploading.value = false;
    });
}
</script>
