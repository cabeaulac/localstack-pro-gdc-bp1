import {createRouter, createWebHistory} from 'vue-router';
import Auth0Callback from '@/views/lsgdc/Auth0Callback.vue';
import {authenticationGuard} from '@/common/authenticationGuard';


const routes = [
  {
    path: '/',
    name: 'Public',
    component: () => import('@/views/pub/PublicHome.vue')
  },
  {
    path: '/lsgdc',
    name: 'Layout',
    component: () => import('@/views/lsgdc/Layout.vue'),
    beforeEnter: authenticationGuard,
    children: [
      {
        path: '',
        name: 'Home',
        component: () => import('@/views/lsgdc/Home.vue')
      },
      {
        path: 's3store',
        name: 'S3Store',
        component: () => import('@/views/lsgdc/S3Storage.vue')
      },
      {
        path: 'user',
        name: 'User',
        component: () => import('@/views/lsgdc/User.vue')
      },
    ],
  },
  {
    path: '/auth0callback',
    name: 'Auth0Callback',
    component: Auth0Callback
  },
  {
    path: '/404',
    name: 'PageNotFound',
    component: () => import('@/views/404.vue')
  },
  {
    path: '/:catchAll(.*)', // Unrecognized path automatically matches 404
    redirect: '/404'
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

// For every new route scroll to the top of the page
// router.beforeEach(function (to, from, next) {
//   window.scrollTo(0, 0);
//   next();
// });

export default router;
