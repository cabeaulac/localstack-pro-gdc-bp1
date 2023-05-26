import type { Auth0ClientOptions } from '@auth0/auth0-spa-js/src/global';
import { acceptHMRUpdate, defineStore } from 'pinia';
import type {
  GetTokenSilentlyOptions,
  LogoutOptions,
  RedirectLoginOptions,
  User
} from '@auth0/auth0-spa-js';
import { Auth0Client } from '@auth0/auth0-spa-js';
import { SessionStorageCache } from '@/stores/sessionStorage';
import { decode } from '@auth0/auth0-spa-js/src/jwt';
import router from '../router';


const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
const callbackUrl = window.location.origin + '/';

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    isAuthenticated: false,
    isLoading: true,
    httpPendingRequests: 0,
    user: undefined as User | undefined,
    accessToken: '',
    // These are the currently selected user claims. Admins can change their claims.
    claims: [] as string[],
    // These are the actual claims. And they are readonly.
    authClaims: [] as string[],
    auth0Client: undefined as Auth0Client | undefined,
    error: null as Error | null
  }),
  getters: {
    // accessTokenDict: (state) => decode(state.accessToken)
  },
  actions: {
    // If the user has any claim that matches any of the permissions input, return true
    hasPermission(...perms: string[]) {
      const found = this.claims.some(perm => perms.includes(perm));
      return found;
    },
    hasAuthPermission(...perms: string[]) {
      const found = this.authClaims.some(perm => perms.includes(perm));
      return found;
    },
    getClaims() {
      const ac = decode(this.accessToken);
      this.claims = (ac.claims?.permissions || []) as string[];
      this.authClaims = this.claims;
    },

    async createClient() {
      if (!this.auth0Client) {
        try {

          console.log('auth0 createClient');
          const options: Auth0ClientOptions = {
            domain,
            clientId,
            authorizationParams: {
              audience: audience,
              redirect_uri: callbackUrl
            },
            leeway: 60,
            useRefreshTokens: true,
            useRefreshTokensFallback: true,
            authorizeTimeoutInSeconds: 30,
            sessionCheckExpiryDays: 1,
            cache: new SessionStorageCache() // not as secure as memory but does work on page reload
          };
          this.error = null;
          this.auth0Client = new Auth0Client(options);
          console.log('auth0client created');
          this.isAuthenticated = await this.auth0Client.isAuthenticated();
        } catch (err: any) {
          this.auth0Client = undefined;
          this.isAuthenticated = false;
          this.error = err.message;
          console.error('createClient ERROR', err);
          this.logout();
        }
        console.log('createClient isAuthenticated', this.isAuthenticated);

        if (this.isAuthenticated) {
          await this.getAccessToken();
        }
      }
      this.isLoading = false;
    },

    async login(options?: RedirectLoginOptions) {
      console.log('auth0 login');
      try {
        await this.auth0Client?.loginWithRedirect(options);
      } catch (err: any) {
        this.error = err;
      }
    },
    async logout(options?: LogoutOptions) {
      console.log('auth0 logout');
      if (!this.auth0Client) {
        return;
      }
      try {
        this.isAuthenticated = false;
        return await this.auth0Client.logout({
          onRedirect: async () => window.location.assign(window.location.origin),
          ...options
        });
      } catch (err: any) {
        this.error = err;
      }
    },
    async handleCallback() {
      console.log('auth0 handleCallback');
      // await this.createClient();
      if (!this.auth0Client) {
        console.error('handleCallback NO auth0 Client !');
        return;
      }

      console.log('await auth0Client.isAuthenticated');
      let userAuthenticated = await this.auth0Client.isAuthenticated();
      console.log('userAuthenticated: ' + userAuthenticated);
      if (userAuthenticated) {
        await this.getAccessToken();
      }

      const params = new URLSearchParams(window.location.search);
      const hasError = params.has('error');
      const hasCode = params.has('code');
      const hasState = params.has('state');

      if (hasError) {
        this.error = new Error(
          params.get('error_description') || 'error completing login process'
        );
        this.isAuthenticated = false;
        return;
      }

      if (hasCode && hasState) {
        try {
          console.log('await handleRedirectCallback');
          const result = await this.auth0Client.handleRedirectCallback();
          console.log('back from handleRedirectCallback');

          let url = '/';

          if (result.appState && result.appState.targetUrl) {
            url = result.appState.targetUrl;
          }

          userAuthenticated = await this.auth0Client.isAuthenticated();
          console.log('userAuthenticated 2: ' + userAuthenticated);

          if (userAuthenticated) {
            await this.getAccessToken();
            this.isAuthenticated = true;
            this.error = null;

            await router.push(url);
            return;
          }
        } catch (err: any) {
          this.error = err;
          console.log('error: ', this.error);
        }
      }
    },
    async getAccessToken(
      options?: GetTokenSilentlyOptions
    ): Promise<string | null> {
      try {
        console.log('getAccessToken');
        const token = (
          // @ts-ignore
          await this.auth0Client.getTokenSilently({
            ...options,
            detailedResponse: true
          })
        ).access_token;
        this.accessToken = token;
        // console.log("accessToken ", this.accessToken);
        this.getClaims();

        this.isAuthenticated = await this.auth0Client?.isAuthenticated() || false;
        if (this.isAuthenticated) {
          this.user = (await this.auth0Client?.getUser()) || undefined;
        } else {
          console.log('getAccessToken user not authenticated');
        }
        return token;
      } catch (err: any) {
        this.accessToken = '';
        this.error = err.message;
        console.error('getAccessToken ERROR', err);
        return null;
      }
    },
    async getAccessTokenPopup(
      options?: GetTokenSilentlyOptions
    ): Promise<string | null> {
      await this.createClient();
      if (!this.auth0Client) {
        return null;
      }
      const token = (await this.auth0Client.getTokenWithPopup(options)) || '';
      this.accessToken = token;
      this.getClaims();
      this.isAuthenticated = await this.auth0Client.isAuthenticated();
      if (this.isAuthenticated) {
        this.user = (await this.auth0Client.getUser()) || undefined;
        // this.isLoading = false;
      }

      return token;
    }
  }
});

if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot));
}
