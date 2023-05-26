import type {Cacheable, ICache} from '@auth0/auth0-spa-js/src/cache';
import {CACHE_KEY_PREFIX} from '@auth0/auth0-spa-js/src/cache';

export class SessionStorageCache implements ICache {
  public debug: boolean = false;

  public set<T = Cacheable>(key: string, entry: T) {
    if (this.debug) console.log('sessionStorageCache.set', key, entry);
    sessionStorage.setItem(key, JSON.stringify(entry));
  }

  public get<T = Cacheable>(key: string) {
    const json = window.sessionStorage.getItem(key);
    if (this.debug) console.log('sessionStorageCache.get', key, json);
    if (!json) return undefined;

    try {
      const payload = JSON.parse(json) as T;
      return payload;
    } catch (e) {
      /* istanbul ignore next */
      return undefined;
    }
  }

  public remove(key: string) {
    if (this.debug) console.log('sessionStorageCache.remove', key);
    sessionStorage.removeItem(key);
  }

  public allKeys() {
    if (this.debug) console.log('sessionStorageCache.allKeys');
    return Object.keys(window.sessionStorage).filter((key) =>
      key.startsWith(CACHE_KEY_PREFIX)
    );
  }
}
