import http from "./http-common";
import type { AxiosRequestConfig } from "axios";

class FilesService {
  mungUrl(url: string) {
    //http://172.18.0.3:4566
    const ipMatch = url.match("http://(\\d+\\.?){4}");
    if (ipMatch) {
      return url.replace(ipMatch[0], "http://host.docker.internal");
    }
    return url;
  }

  upload(
    data: { url: string },
    file: File,
    onUploadProgress: AxiosRequestConfig["onUploadProgress"]
  ) {
    return http.put(this.mungUrl(data.url), file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress,
    });
  }

  open(url: string) {
    const mungUrl = this.mungUrl(url);
    window.open(mungUrl, "_blank", "fullscreen=yes")?.focus();
  }
}

export default new FilesService();
