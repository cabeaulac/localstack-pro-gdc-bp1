import { createApp } from 'vue';
import VueSmoothScroll from 'vue3-smooth-scroll';
import type { PluginOptions } from 'vue-toastification';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';
import '@/assets/gds2/style.scss';
import { autoAnimatePlugin } from '@formkit/auto-animate/vue'
import App from './App.vue';
import router from './router';
import {createPinia} from 'pinia';

export const app = createApp(App);

const pinia = createPinia();
const toastOptions: PluginOptions = {};

app.use(VueSmoothScroll);
app.use(autoAnimatePlugin);
app.use(Toast, toastOptions);
app.use(router);
app.use(pinia);

app.directive('focus', {
  mounted(el: HTMLElement) {
    el.focus()
  }
})

app.mount('#app');

