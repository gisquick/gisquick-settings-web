import Vue from 'vue'
import VueRouter from 'vue-router'
import pick from 'lodash/pick'

// import TestView from '@/views/TestView.vue'
import TestView from '@/views/TestJsonDiff.vue'
import ProjectsView from '@/views/ProjectsView.vue'
import UserProfile from '@/views/UserProfile.vue'

import ProjectView from '@/views/ProjectView.vue'
import ProjectFiles from '@/views/ProjectFiles.vue'
import ProjectMap from '@/views/ProjectMap.vue'
import ProjectLayers from '@/views/ProjectLayers.vue'
import LayerSettings from '@/views/LayerSettings.vue'
import PublishView from '@/views/PublishView.vue'
import ProjectTopics from '@/views/ProjectTopics.vue'
import ProjectAccess from '@/views/ProjectAccess.vue'
import ProjectBookmarks from '@/views/ProjectBookmarks.vue'
import ProjectUpdate from '@/views/ProjectUpdate.vue'

Vue.use(VueRouter)

const routes = [
  // {
  //   path: '/test',
  //   name: 'test',
  //   component: TestView
  // },
  {
    path: '/',
    name: 'profile',
    component: UserProfile
  },
  // {
  //   path: '/',
  //   name: 'projects',
  //   component: ProjectsView
  // },
  {
    path: '/publish',
    name: 'publish',
    component: PublishView,
    props: true
  },
  {
    path: '/:user',
    name: 'user-projects',
    component: ProjectsView,
    props: true
  },
  {
    path: '/:user/:name/',
    name: 'project',
    props: true,
    // component: ProjectFiles,
    component: ProjectView,
    // redirect: { name: 'settings' },
    children: [
      {
        path: 'map',
        name: 'map',
        component: ProjectMap
      },
      {
        path: 'files',
        name: 'files',
        component: ProjectFiles
      },
      {
        path: 'layers',
        name: 'layers',
        component: ProjectLayers
      },
      {
        path: 'layers/settings/:layerId',
        name: 'layer-settings',
        component: LayerSettings,
        props: route => pick(route.params, ['layerId'])
      },
      {
        path: 'topics',
        name: 'topics',
        component: ProjectTopics
      },
      {
        path: 'access',
        name: 'access',
        component: ProjectAccess
      },
      {
        path: 'bookmarks',
        name: 'bookmarks',
        component: ProjectBookmarks,
      },
      {
        path: 'update',
        name: 'update',
        component: ProjectUpdate
      }
    ]
  }
  // {
  //   path: '/about',
  //   name: 'About',
  //   // route level code-splitting
  //   // this generates a separate chunk (about.[hash].js) for this route
  //   // which is lazy-loaded when the route is visited.
  //   component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  // }
]

const router = new VueRouter({
  mode: 'history',
  base: '/' + location.pathname.slice(1).split('/')[0], // works with any pathname with depth = 1 
  // base: import.meta.env.BASE_URL,
  routes
})

export default router
