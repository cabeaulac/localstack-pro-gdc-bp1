import { app } from '@/main';
import { useAuthStore } from '@/stores/auth';
import { acceptHMRUpdate, defineStore, storeToRefs } from 'pinia';
import { type Ref, ref, watch } from 'vue';

const buildWsEndpoint = (token: string = ''): string => {
  let url = (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
    window.location.host + /ws/;
  if (isLocal) {
    url = `${url}?auth=${token}`;
  }
  return url;
};

export interface IWebSocketMessage {
  action: string;
  data: any;
}

export interface ISysMessage {
  message: string;
  timeout?: number | false;
}

type IMsgSubCb = (msg: IWebSocketMessage) => void;

type IMsgSubs = Record<string, IMsgSubCb[]>;

const msgSubs: IMsgSubs = {};


interface SocketCallbacks {
  onclose: (ev: CloseEvent) => any;
  onerror: (ev: Event) => any;
  onmessage: (ev: MessageEvent) => any;
  onopen: (ev: Event) => any;
  reconnect: (count: number, delay: number) => void;
  reconnect_error: () => void;
}

const localStr: string = import.meta.env.VITE_IS_LOCAL;
const isLocal: boolean = (localStr || '').toLowerCase() === 'true';

const dispatchMessages = (msg: IWebSocketMessage) => {
  const cbfs = msgSubs[msg.action];
  if (!cbfs) {
    console.log('no callbacks for message type ', msg.action);
    return;
  }
  cbfs.forEach((cbf) => {
    try {
      cbf(msg);
    } catch (err) {
      console.error('dispatchMessages cbf err for message type ' + msg.action, err);
    }
  });
};
const queuedMessages: IWebSocketMessage[] = [];

export const useSocketStore = defineStore(
  'websocket', () => {
    // Connection Status
    const isConnected = ref(false);

    // Reconnect error
    const reconnectError = ref(false);
    // Heartbeat message sending time
    const heartBeatInterval = ref(50000);
    // Heartbeat timer
    const heartBeatTimer = ref(0);
    const maxRetryAttempts = ref(5);
    const retryAttempt = ref(0);
    const autoReconnect = ref(true);
    let websocket: WebSocket | undefined;

    const getToken = async (): Promise<string | null> => {
      const authStore = useAuthStore();
      const { getAccessToken, getAccessTokenPopup } = authStore;
      const { accessToken } = storeToRefs(authStore);

      if (accessToken.value) {
        return accessToken.value;
      }
      console.log('WS refresh Token');
      try {
        return await getAccessToken();
      } catch (e) {
        console.warn(
          'WARN',
          'Silent token refresh failed. Trying popup....',
          e
        );
        try {
          return await getAccessTokenPopup();
        } catch (ex) {
          console.warn(
            'ERROR',
            'Login for token refresh failed. Bailing....',
            e
          );
          return null;
        }
      }
    };
    const socketMethods: SocketCallbacks = {
      onopen: (event: Event) => {
        console.log('SOCKET_ONOPEN', event);
        app.config.globalProperties.$socket = event.currentTarget;
        isConnected.value = true;
        reconnectError.value = false;
        if (!retryAttempt.value) {
          const authStore = useAuthStore();
          const { user } = authStore;
          let username = user?.given_name || '';
          if (username) {
            username += ' - ';
          }
          console.log(`${username}Enterprise connection established`);
        }
        retryAttempt.value = 0;
        if (queuedMessages.length) {
          console.log('sending queued messages');
        }
        while (queuedMessages.length) {
          sendObj(queuedMessages.pop());
        }

        /*
        // When the connection is successful, start sending heartbeat messages regularly to avoid being disconnected by the server
        this.heartBeatTimer = setInterval(() => {
          const message = "Heartbeat message";
          this.isConnected &&
          sendObj({
            code: 200,
            msg: message
          });
        }, this.heartBeatInterval);*/
      },
      onclose: (event: CloseEvent) => {
        console.log('SOCKET_ONCLOSE', event);
        isConnected.value = false;
        // Stop the heartbeat message when the connection is closed
        window.clearInterval(heartBeatTimer.value);
        heartBeatTimer.value = 0;
        console.log('WS disconnected: ' + new Date());
        if (autoReconnect.value && retryAttempt.value < maxRetryAttempts.value) {
          socketMethods.reconnect(retryAttempt.value++, retryAttempt.value * 500);
        } else {
          socketMethods.reconnect_error();
        }
      },
      onmessage: (msg: MessageEvent<string>) => {
        console.log('SOCKET_ONMESSAGE', msg);
        dispatchMessages(JSON.parse(msg.data));
      },
      onerror: (event: Event) => {
        console.log('SOCKET_ONERROR', event);
      },
      reconnect: (count: number, delay: number = 0) => {
        console.log('SOCKET_RECONNECT attempt #' + count);
        setTimeout(() => {
          connect();
        }, delay);
      },
      reconnect_error: () => {
        console.log('SOCKET_RECONNECT_ERROR');
        reconnectError.value = true;
      }
    };
    const disconnect = (): void => {
      console.log('websocket disconnect');
      websocket?.close();
      websocket = undefined;
    };
    const onWsEvent = (): void => {
      console.log('setting up websocket onWsEvent');
      if (!websocket) return;
      ['onmessage', 'onclose', 'onerror', 'onopen'].forEach(
        (eventType: string) => {
          // @ts-ignore
          websocket[eventType] = (event: any) => {
            console.log(eventType);
            // @ts-ignore
            if (Object.hasOwn(socketMethods, eventType)) {
              // @ts-ignore
              socketMethods[eventType](event);
            }
            if (autoReconnect.value && eventType === 'onopen') {
              retryAttempt.value = 0;
            }
            if (autoReconnect.value &&
              retryAttempt.value < maxRetryAttempts.value &&
              eventType === 'onclose') {
              socketMethods.reconnect(retryAttempt.value++, 0);
            }
          };
        }
      );
    };
    const connect = (): void => {
      getToken()
        .then((token: string | null) => {
          if (!token) {
            throw new Error('ws_ticket data is null');
          }
          return token;
        })
        .then(
          (token: string) => {
            console.log('websocket connect. Token: ', token);
            console.log('websocket isLocal: ', isLocal);

            const url = buildWsEndpoint(token);
            let protocol: string[] | null = ['auth', token];
            if (isLocal) {
              console.log('This is local deployment', url);
              // Localstack was skipping all headers returned from WS lambda.
              // So temporary disable header authorization for Localstack.
              protocol = null;
            }
            websocket = protocol
              ? new WebSocket(url, protocol)
              : new WebSocket(url);
            onWsEvent();
          },
          (err: any) => {
            console.error('Cannot get token: ', err);
            if (
              autoReconnect.value &&
              retryAttempt.value < maxRetryAttempts.value
            ) {
              socketMethods.reconnect(retryAttempt.value++, 3000);
            } else {
              socketMethods.reconnect_error();
            }
          }
        );
    };
    const watchAuth = async () => {
      const authStore = useAuthStore();
      const { isAuthenticated, isLoading } = storeToRefs(authStore);
      subscribeToAction('sysMsg', (msg: IWebSocketMessage) => {
        const sysMsg = msg.data as ISysMessage;
        console.log('sysMsg ' + sysMsg);
      });
      watch(
        isAuthenticated,
        (authenticated: boolean) => {
          if (authenticated && !isConnected.value) {
            connect();
            return;
          }
          if (!isLoading.value && !authenticated && isConnected.value) {
            disconnect();
          }
        },
        { immediate: true }
      );
    };
    const sendObj = (obj: IWebSocketMessage | undefined): void => {
      try {
        obj && websocket?.send(JSON.stringify(obj));
      } catch (ex) {
        console.error(ex);
      }
    };
    const sendMessage = (msg: IWebSocketMessage): void => {
      if (isConnected.value) {
        sendObj(msg);
        return;

      }
      if (queuedMessages.length > 1000) {
        console.warn('messages queued more than 1000, refusing to queue');
        return;
      }
      console.log('not connected, queuing message');
      queuedMessages.push(msg);
    };
    const subscribeToAction = (action: string, cbf: IMsgSubCb): void => {
      let cbfs = msgSubs[action];
      if (!cbfs) {
        msgSubs[action] = [];
        cbfs = msgSubs[action];
      }
      if (!cbfs.includes(cbf)) {
        cbfs.push(cbf);
      }
    };
    const unsubscribeFromAction = (action: string, cbf: IMsgSubCb): void => {
      const cbfs = msgSubs[action];
      if (!cbfs) {
        return;
      }
      const i = cbfs.indexOf(cbf);
      if (i > -1) {
        cbfs.splice(i, 1);
      }
    };

    return {
      // Connection Status
      isConnected,

      // Reconnect error
      reconnectError,
      // Heartbeat message sending time
      heartBeatInterval,
      // Heartbeat timer
      heartBeatTimer,
      maxRetryAttempts,
      retryAttempt,
      autoReconnect,
      subscribeToAction,
      unsubscribeFromAction,
      sendMessage,
      watchAuth
    };
  }
);
if (import.meta.hot) {
  // @ts-ignore
  import.meta.hot.accept(acceptHMRUpdate(useSocketStore,
    import.meta.hot));
}
