import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import type {
  NavigationGuardNext,
  RouteLocationNormalized,
  RouteLocationRaw
} from 'vue-router';
import router from '@/router'
import { watch } from 'vue';

export const authenticationGuard = async (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized
): Promise<void | Error | RouteLocationRaw | boolean | NavigationGuardNext> => {
  console.log('authenticationGuard', {to, from});
  const store = useAuthStore();
  const {isAuthenticated, isLoading} = storeToRefs(store);
  const {login} = store;
  // Open a client connection to Auth0
  await store.createClient();
  const guardAction = async () => {
    // console.log('guardAction');
    if (isAuthenticated.value) {
      // console.log('returning true');
      return true;
    }

    // Create Auth0 callback URL
    const callBackRoute = router.resolve({name: 'Auth0Callback'});
    const absoluteURL = new URL(callBackRoute.href, window.location.origin).href;
    // console.log('calling login');
    login({
      openUrl: async (url) => window.location.replace(url),
      authorizationParams: {
        redirect_uri: absoluteURL
      },
      // Store path app is trying to navigate to
      appState: {
        targetUrl: to.fullPath
      }
    });
    // console.log('returning false');
    return false;
  };

  if (!isLoading.value) {
    // console.log('not loading, calling guardAction');
    return guardAction();
  }
  console.log('we are loading');
  return new Promise((resolve) => {
    watch(isLoading, (currentValue) => {
      // console.log('watch isloading', currentValue);
      if (!currentValue) {
        // console.log('not loading, resolving with guardAction');
        resolve(guardAction());
      }
    });
  });
  // Watch for loading to change
};
