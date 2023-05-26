import {defineStore} from 'pinia';
import {computed, type Ref, ref} from 'vue';
import type {
  IIdRk,
  IS3Item,
  S3SignedUrlData,
  UploadableFile
} from '@/types/service-types';
import type {IAjaxResponse} from '@/common/httpService';
import userService from '@/services/userService';
import {type IWebSocketMessage, useSocketStore} from '@/stores/websocket';

export const useS3ItemStore = defineStore('s3item', () => {
  const wsStore = useSocketStore();
  const isPreviewOpen = ref(false);
  const isAddFolderOpen = ref(false);
  const isAddFileOpen = ref(false);
  const isRenameOpen = ref(false);
  const isUploadOpen = ref(false);

  const previewedS3Item: Ref<IS3Item | null> = ref(null);
  const selectedFiles: Ref<UploadableFile[]> = ref([]);
  const allSelected = ref(false);
  const selectedS3Items: Ref<IS3Item[]> = ref([]);
  const previousSelection: Ref<IS3Item | null> = ref(null);
  const s3Items: Ref<IS3Item[]> = ref([]);

  function getRandomInt(min: number, max: number) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  const badges = ['badge-red', 'badge-orange', 'badge-yellow', 'badge-green', 'badge-blue', 'badge-violet', 'badge-gray'];
  const fakeTags = computed(() => [...new Set(s3Items.value.map(file => file.tags).flat())]);
  const tagToColor = ref({}) as Ref<{ [key: string]: string }>;

  function getTagToColor() {
    const newTags = fakeTags.value.filter(val => !Object.keys(tagToColor.value).includes(val));
    newTags.forEach(tag => tagToColor.value[tag] = badges[getRandomInt(0, badges.length - 1)]);
    return tagToColor;
  }


  function fileExists(otherId: string) {
    return selectedFiles.value.some(({id}) => id === otherId);
  }

  function removeFile(file: UploadableFile) {
    const index = selectedFiles.value.indexOf(file);
    if (index > -1) selectedFiles.value.splice(index, 1);
  }

  function clearFiles() {
    selectedFiles.value = [];
  }

  function clearSelectedS3Items() {
    selectedS3Items.value = [];
  }

  function s3UploadUrls(
    fileData: Array<{ index: number; name: string; type: string; path: string }>
  ): Promise<IAjaxResponse<S3SignedUrlData[]>> {
    return userService.s3ItemUploadUrls(fileData);
  }


  function removeS3Item(s3ItemRk: string) {
    s3Items.value = s3Items.value.filter(
      (vi) => vi.rk !== s3ItemRk
    );
  }

  function loadS3Items() {
    // Get the logged in user
    userService.getS3Items().then((data: IAjaxResponse<IS3Item[]>) => {
      if (!data.data) {
        console.error(
          'Cannot get S3 Items',
          data.message || 'Error',
          data
        );
        return;
      }
      s3Items.value = data.data;
      console.log('got S3 items ', s3Items.value);
    });
  }

  function deleteS3Item(s3ItemRk: string) {
    userService.deleteS3Item(s3ItemRk).then((data: IAjaxResponse<IIdRk>) => {
      if (!data.data) {
        console.error(
          'Cannot delete contact',
          data.message || 'Error',
          data
        );
        return;
      }
      removeS3Item(s3ItemRk);
      console.log('contact removed ', data.data);
    });
  }


  function insertS3Item(vi: IS3Item) {
    // Insert the new object into the sorted list
    let indexToInsert = s3Items.value.length;
    for (let i = 0; i < s3Items.value.length; i++) {
      if (s3Items.value[i].rk > vi.rk) {
        indexToInsert = i;
        break;
      }
    }
    s3Items.value.splice(indexToInsert, 0, vi);
  }

  function modifyS3Item(s3Item: IS3Item) {
    // Insert or update the object into the sorted list
    const index = s3Items.value.findIndex(obj => obj.rk === s3Item.rk);
    if (index === -1) {
      s3Items.value.push(s3Item);
    } else {
      s3Items.value.splice(index, 1, s3Item);
    }
  }

  const insertS3ItemMsg = (msg: IWebSocketMessage) => {
    console.log('s3 store got insertS3ItemMsg msg', msg);
    const vi = msg.data as IS3Item;
    insertS3Item(vi);
  };

  const modifyS3ItemMsg = (msg: IWebSocketMessage) => {
    console.log('s3 store got modifyS3ItemMsg msg', msg);
    const vi = msg.data as IS3Item;
    modifyS3Item(vi);
  };

  const removeS3ItemMsg = (msg: IWebSocketMessage) => {
    console.log('s3 store got removeS3ItemMsg msg', msg);
    const removeMsg = msg.data as IIdRk;
    removeS3Item(removeMsg.rk);
  };

  function registerForWsEvents() {
    wsStore.subscribeToAction('insertS3Item', insertS3ItemMsg);
    wsStore.subscribeToAction('modifyS3Item', modifyS3ItemMsg);
    wsStore.subscribeToAction('removeS3Item', removeS3ItemMsg);
  }

  function unregisterForWsEvents() {
    wsStore.unsubscribeFromAction('insertS3Item', insertS3ItemMsg);
    wsStore.unsubscribeFromAction('modifyS3Item', modifyS3ItemMsg);
    wsStore.unsubscribeFromAction('removeS3Item', removeS3ItemMsg);
  }

  function addTag(tag: string, s3Item: IS3Item) {
    const item = s3Items.value.filter((vi) => s3Item.rk === vi.rk)[0];
    item.tags.push(tag);
    // If the new tag is unique, assign a random color to it
    getTagToColor();
    // Get the logged-in user
    userService.setTags(item.tags, s3Item).then((data: IAjaxResponse<IS3Item>) => {
      if (!data.data) {
        console.error(
          'Cannot add tag to item',
          data.message || 'Error',
          data
        );
        return;
      }
      console.log('patched s3Item ', data.data);
    });


  }

  return {
    isPreviewOpen,
    isAddFolderOpen,
    isAddFileOpen,
    isRenameOpen,
    s3Items,
    previewedS3Item,
    allSelected,
    isUploadOpen,
    previousSelection,
    selectedFiles,
    selectedS3Items,
    getTagToColor,
    tagToColor,
    loadS3Items,
    deleteS3Item,
    fileExists,
    removeFile,
    clearFiles,
    clearSelectedS3Items,
    s3UploadUrls,
    registerForWsEvents,
    unregisterForWsEvents,
    addTag
  };
});
