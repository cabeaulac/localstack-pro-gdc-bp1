import {
  genericApiErrorHandler,
  HTTPService,
  type IAjaxResponse,
  type ServiceResponse
} from '@/common/httpService';
import type {
  IS3User, IIdRk, IS3Item,
  S3SignedUrlData
} from '@/types/service-types';

// Get the api stage and version vars from env.
// We inject these in application.makefile in dev and in the uiPublisher.ts in AWS
const apiStage = import.meta.env.VITE_API_STAGE;
const apiVersion = import.meta.env.VITE_API_VERSION;

// TODO: Get this from the APIGW stage
const apiBase: string = `/${apiStage}`;
const userHttpService = HTTPService.getService({
  baseURL: apiBase,
  sendTokenByDefault: false,
  blacklist: ['/v1/pub'],
  whitelist: '/'
});

class UserService {

  retrieveUser() {
    const response = userHttpService
      .get<ServiceResponse<IAjaxResponse<IS3User>>>(`/${apiVersion}/user`)
      .then(genericApiErrorHandler);

    return response;
  }

  getS3Items() {
    const response = userHttpService
      .get<ServiceResponse<IAjaxResponse<IS3Item[]>>>(`/${apiVersion}/s3`)
      .then(genericApiErrorHandler);

    return response;
  }


  deleteS3Item(viRk: string) {
    const response = userHttpService
      .delete<ServiceResponse<IAjaxResponse<IIdRk>>>(`/${apiVersion}/s3/${viRk}`)
      .then(genericApiErrorHandler);

    return response;
  }


  getS3UploadUrls(rqst: {
    area: string;
    files: Array<{ index: number; name: string; type: string }>
  }): Promise<IAjaxResponse<S3SignedUrlData[]>> {
    return userHttpService
      .post<ServiceResponse<IAjaxResponse<S3SignedUrlData[]>>>(
        `/${apiVersion}/upload`,
        undefined,
        rqst
      )
      .then(genericApiErrorHandler);
  }


  s3ItemUploadUrls(
    fileData: Array<{ index: number; name: string; type: string; path: string }>
  ): Promise<IAjaxResponse<S3SignedUrlData[]>> {
    const uploadUrlRequest = {
      area: 's3_upload',
      files: fileData
    };
    return this.getS3UploadUrls(uploadUrlRequest);
  }

  setTags(tags: string[], s3Item: IS3Item): Promise<IAjaxResponse<IS3Item>> {
    return userHttpService
      .patch<ServiceResponse<IAjaxResponse<IS3Item>>>(
        `/${apiVersion}/s3/${s3Item.rk}/tags`,
        undefined,
        tags
      )
      .then(genericApiErrorHandler);
  }

}

export default new UserService();
