import { defineStore } from 'pinia';
import type { IAjaxResponse } from '@/common/httpService';

import { type Ref, ref, type UnwrapRef } from 'vue';
import type { IContact, IS3User } from '@/types/service-types';
import userService from '@/services/userService';
import type { S3SignedUrlData } from '@/types/service-types';


export const useUserStore = defineStore('userStore', () => {
  const useMockData = ref(true);
  const cuser: Ref<UnwrapRef<IS3User>> = ref({
    id: '',
    rk: '',
    uid: '',
    createDt: '',
    prefs: {},
    contacts: []
  });

  function retrieveUser() {
    // Get the logged in user
    userService.retrieveUser().then((data: IAjaxResponse<IS3User>) => {
      if (!data.data) {
        console.error(
          'Cannot get User data',
          data.message || 'Error',
          data
        );
        return;
      }
      cuser.value = data.data;
      console.log('user ', cuser.value);
    });
  }



  return {
    cuser,
    retrieveUser,
  };
});
