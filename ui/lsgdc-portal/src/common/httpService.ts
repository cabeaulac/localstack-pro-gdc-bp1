import type { LogLevel } from '@/common/logger';
import { Logger } from '@/common/logger';
import { useAuthStore } from '@/stores/auth';
import type { AxiosInstance, AxiosRequestConfig, Method } from 'axios';
import axios, { AxiosError } from 'axios';

export interface MyAxiosRequestConfig<D = any> extends AxiosRequestConfig {
  __isRetryRequest: boolean;
}

export interface IAjaxResponse<T> {
  status: boolean;
  message?: string;
  httpCode?: number;
  data: T | null;
}

export type JsonRequestData =
  | string
  | number
  | boolean
  | null
  | JsonRequestData[]
  | { [key: string]: JsonRequestData };

export const genericApiErrorHandler = <T>(
  data: ServiceResponse<IAjaxResponse<T>>
): IAjaxResponse<T> => {
  if (!data) {
    console.error('Cannot complete request');
    throw new Error('Cannot complete request');
  }
  if (data instanceof AxiosError) {
    console.error(
      'AxiosError:',
      (data.response?.data as any)?.message || data.message || 'AxiosError'
    );
    throw data;
  }
  if (data instanceof Error) {
    console.error('Error', data.message || 'Error', data);
    throw data;
  }
  return data;
};

export const handleHttpError = (
  err: Error | AxiosError
): IAjaxResponse<any | null> => {
  if (err instanceof AxiosError) {
    console.error('An error occurred:', err.message);
    console.error(
      `Backend returned code ${err.status}, body was: ${err.response?.data}`
    );
    return {
      status: false,
      data: err.response?.data || null,
      message: err.message || 'error'
    };
  }
  console.error('An error occurred:', err.message);
  console.error(err);
  return { status: false, data: null, message: err.message || 'error' };
};

export type ServiceResponse<T> = T | Error | AxiosError | null;

/***
 * Configuration options for HTTPService
 */
export interface HTTPServiceConfig {
  baseURL: string;
  sendTokenByDefault: boolean;
  retryAuthFailedRequest: boolean;
  blacklist: string | RegExp | Array<string | RegExp>;
  whitelist: string | RegExp | Array<string | RegExp>;
  logLevel: LogLevel;
}

/***
 * Defaults for HTTPService
 */
export const HTTPServiceConfigDefaults: HTTPServiceConfig = {
  baseURL: '',
  sendTokenByDefault: false,
  retryAuthFailedRequest: true,
  blacklist: '',
  whitelist: '',
  logLevel: 'DEBUG'
};

/***
 * HTTPService makes requests and auto appends / refreshes authorization token if needed
 */
export class HTTPService {
  protected instance: AxiosInstance;
  protected token: string = '';
  protected config: HTTPServiceConfig;
  protected isRefreshing: boolean = false;
  protected failedRequests: {
    resolve: (value: unknown) => void;
    reject: (reason?: any) => void;
  }[] = [];
  protected logger: Logger = new Logger();

  private constructor(config?: Partial<HTTPServiceConfig>) {
    this.config = { ...HTTPServiceConfigDefaults, ...(config || {}) };
    this.instance = axios.create({
      baseURL: this.config.baseURL
    });
    this.logger.logThreshold = this.config.logLevel;

    // this.initializeRequestInterceptor();
    this.initializeResponseInterceptor();
  }

  /***
   * Create a new HTTPService
   *
   * @param config
   */
  public static getService(config?: Partial<HTTPServiceConfig>): HTTPService {
    return new HTTPService(config);
  }

  /***
   * Make api request using auth token if config requires / allows it.
   * @param method GET, POST, PUT, DELETE
   * @param url url with any url params
   * @param headers headers to send. Defaults to {'content-type': 'application/json'}
   * @param sendData any data to send to server in request body
   */
  public async request<T>(
    method: Method,
    url: string,
    headers?: Record<string, string>,
    sendData?: JsonRequestData
  ): Promise<ServiceResponse<T>> {
    const config: MyAxiosRequestConfig = {
      url,
      method: method,
      headers: headers || {
        'content-type': 'application/json'
      },
      __isRetryRequest: false,
      data: sendData
    };
    const useToken = this.needsToken(url);
    console.log(`Do we need a token? ${useToken}`);
    this.logIt('DEBUG', { useToken, url });
    if (useToken && !this.token) {
      this.token = await this.refreshToken();
    }
    if (useToken && !this.token) {
      return null;
    }
    if (this.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${this.token}`
      };
    }
    try {
      const response = await this.instance(config);
      if (!response?.data) {
        this.logIt('WARN', 'HTTP Service NO DATA');
        return null;
      }
      const { data } = response;
      console.log('#####', typeof data, data);
      return data;
    } catch (ex: any) {
      this.logIt('ERROR', ex);
      return ex;
    }
  }

  /***
   * Thin wrapper around request method
   * @param url
   * @param headers headers to send. Defaults to {'content-type': 'application/json'}
   */
  public get<T>(
    url: string,
    headers?: Record<string, string>
  ): Promise<ServiceResponse<T>> {
    return this.request<T>('GET', url, headers);
  }

  /***
   * Thin wrapper around request method
   * @param url
   * @param headers headers to send. Defaults to {'content-type': 'application/json'}
   * @param data to send in body of request
   */
  public put<T>(
    url: string,
    headers?: Record<string, string>,
    data?: JsonRequestData
  ): Promise<ServiceResponse<T>> {
    return this.request<T>('PUT', url, headers, data);
  }

  /***
   * Thin wrapper around request method
   * @param url
   * @param headers headers to send. Defaults to {'content-type': 'application/json'}
   * @param data to send in body of request
   */
  public post<T>(
    url: string,
    headers?: Record<string, string>,
    data?: JsonRequestData
  ): Promise<ServiceResponse<T>> {
    return this.request<T>('POST', url, headers, data);
  }

  /***
   * Thin wrapper around request method
   * @param url
   * @param headers headers to send. Defaults to {'content-type': 'application/json'}
   * @param data to send in body of request
   */
  public patch<T>(
    url: string,
    headers?: Record<string, string>,
    data?: JsonRequestData
  ): Promise<ServiceResponse<T>> {
    return this.request<T>('PATCH', url, headers, data);
  }

  /***
   * Thin wrapper around request method
   * @param url
   * @param headers headers to send. Defaults to {'content-type': 'application/json'}
   * @param data to send in body of request
   */
  public delete<T>(
    url: string,
    headers?: Record<string, string>,
    data?: JsonRequestData
  ): Promise<ServiceResponse<T>> {
    return this.request<T>('DELETE', url, headers, data);
  }

  /***
   * Intercepts auth errors and refreshes token if needed
   */
  private initializeResponseInterceptor = () => {
    this.instance.interceptors.response.use((response) => {
      return response;
    }, this.handleError);
  };

  /***
   * Log to logger
   * @param logLevel log level of message
   * @param msg message or data to log
   * @private
   */
  private logIt(logLevel: LogLevel, ...msg: any): void {
    this.logger.logIt(logLevel, ...msg);
  }

  private handleRequest = (config: AxiosRequestConfig) => {
    // if (!config.headers) return config;
    // config.headers['Authorization'] = `Bearer ${this.token}`;
    return config;
  };

  /***
   * Handles authorization errors, token refresh and retry of requests.
   * @param err
   */
  private handleError = async (err: AxiosError) => {
    this.logIt('ERROR', err);

    const axiosConfig: MyAxiosRequestConfig =
      err.config as MyAxiosRequestConfig;
    const useToken =
      this.config?.retryAuthFailedRequest &&
      this.needsToken(axiosConfig.url || '');

    if (
      err.response?.status === 401 &&
      this.config?.retryAuthFailedRequest &&
      useToken &&
      err &&
      !axiosConfig.__isRetryRequest
    ) {
      this.logIt('WARN', 'Got 401 response');
      this.logIt('DEBUG', {
        isRefreshing: this.isRefreshing,
        __isRetryRequest: axiosConfig.__isRetryRequest
      });

      if (this.isRefreshing) {
        try {
          this.logIt('DEBUG', 'Adding to failed request queue');
          const token = await new Promise((resolve, reject) => {
            this.failedRequests.push({ resolve, reject });
          });
          this.logIt('DEBUG', 'Token resolved trying request again');
          if (!axiosConfig.headers) {
            axiosConfig.headers = {};
          }
          axiosConfig.headers['Authorization'] = `Bearer ${token}`;
          return this.instance(axiosConfig);
        } catch (e) {
          this.logIt('ERROR', 'Failed request wait for token failed');
          console.error(e);
          return e;
        }
      }
      this.isRefreshing = true;
      axiosConfig.__isRetryRequest = true;
      return new Promise((resolve, reject) => {
        this.logIt('INFO', 'Refreshing token');
        this.refreshToken()
          .then((token: string) => {
            if (!axiosConfig.headers) {
              axiosConfig.headers = {};
            }
            axiosConfig.headers.Authorization = `Bearer ${token}`;
            this.isRefreshing = false;
            this.logIt('INFO', 'Processing queue with new token');
            this.processQueue(null, token);
            resolve(this.instance(axiosConfig));
          })
          .catch((e) => {
            this.logIt('ERROR', 'caught error', e);
            this.logIt(
              'ERROR',
              'processing queue with failed token request from catch'
            );
            this.processQueue(e, null);
            reject(err);
            // if (HTTPService.pendingRequests > 0) HTTPService.pendingRequests--;
            window.location.assign('/');
          });
      });
    }
    // if (HTTPService.pendingRequests > 0) HTTPService.pendingRequests--;
    throw err;
  };

  /**
   * Retry to fail out pending requests
   * @param error if error is provided all pending requests are failed out
   * @param token if token is provided all pending requests are re-tried with new token
   * @private
   */
  private processQueue(
    error: AxiosError | Error | null,
    token: string | null = null
  ) {
    this.failedRequests.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedRequests = [];
  }

  /***
   * Attempts to get new token in this order silently, pop-up, redirect
   * @private
   */
  private async refreshToken(): Promise<string> {
    try {
      const authStore = useAuthStore();
      const { getAccessToken } = authStore;
      this.token = (await getAccessToken()) || '';
    } catch (e) {
      this.logIt('WARN', 'Silent token refresh failed. Trying popup....', e);
      // try {
      //   this.token = (await getAccessTokenPopup()) || '';
      // } catch (ex) {
      //   this.logIt('WARN', 'Popup token refresh failed. Trying login....', e);
      //   try {
      //     await login({
      //       appState: {
      //         targetUrl: window.location.toString(),
      //       },
      //     });
      //     this.token = (await getAccessToken()) || '';
      //   } catch (ex2) {
      //     this.logIt('ERROR', 'Login for token refresh failed. Bailing....', e);
      //     this.token = '';
      //   }
      // }
    }
    return this.token;
  }

  /***
   * Checks url against any configured black / white list and returns true if an auth token should be sent
   * @param url
   * @private
   */
  private needsToken(url: string): boolean {
    if (!url) return false;
    const { whitelist, blacklist } = this.config || HTTPServiceConfigDefaults;

    if (blacklist) {
      this.logIt('INFO', 'needsToken using blacklist');
      if (Array.isArray(blacklist)) {
        for (const urlTest of blacklist) {
          if (typeof urlTest === 'string') {
            if (url.toLowerCase().startsWith(urlTest.toLowerCase())) {
              return false;
            }
          } else if (urlTest.test(url)) {
            return false;
          }
        }
      } else {
        if (typeof blacklist === 'string') {
          if (url.toLowerCase().startsWith(blacklist.toLowerCase())) {
            return false;
          }
        } else if (blacklist.test(url)) {
          return false;
        }
      }
    }
    if (whitelist) {
      this.logIt('INFO', 'needsToken using whitelist');
      if (Array.isArray(whitelist)) {
        for (const urlTest of whitelist) {
          if (typeof urlTest === 'string') {
            if (url.toLowerCase().startsWith(urlTest.toLowerCase())) {
              return true;
            }
          } else if (urlTest.test(url)) {
            return true;
          }
        }
      } else {
        if (typeof whitelist === 'string') {
          if (url.toLowerCase().startsWith(whitelist.toLowerCase())) {
            return true;
          }
        } else if (whitelist.test(url)) {
          return true;
        }
      }
    }
    return this.config.sendTokenByDefault === undefined
      ? HTTPServiceConfigDefaults.sendTokenByDefault
      : this.config.sendTokenByDefault;
  }
}
