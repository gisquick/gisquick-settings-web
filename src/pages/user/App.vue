<template>
  <div class="app">
    <div class="header-bg"/>
    <!-- <div class="logo f-row-ac m-2">
      <img src="./assets/text_logo_dark.svg"/>
    </div> -->
    <router-link class="logo f-row-ac px-2" to="/">
      <img src="@/assets/text_logo_dark.svg"/>
    </router-link>
    <portal-target name="menu" class="menu">
      <!-- <div class="dark f-row-ac">Placeholder</div> -->
    </portal-target>
    <div class="app-menu f-row-ac f-justify-end dark">
      <div class="f-row-ac mr-2">
        <img :src="pluginStatusImg" height="22"/>
        <v-tooltip>
          <span v-text="clientInfo || 'QGIS Plugin is not connected'"/>
        </v-tooltip>
      </div>
      <v-menu
        aria-label="Menu"
        transition="slide-y"
        align="rr;bb,tt"
        class="m-2"
        content-class="popup-menu"
        :items="menuItems"
      >
        <template v-slot:activator="{ toggle }">
          <v-btn aria-label="Menu" class="icon ml-0" @click="toggle">
            <v-icon name="account" size="24"/>
          </v-btn>
        </template>
      </v-menu>
    </div>

    <router-view v-if="!showLoginDialog" class="page-content"/>
    <login-dialog
      login-required
      :value="showLoginDialog"
      :password-reset-url="app.reset_password_url"
      @login="onLogin"
    />
    <change-password-dialog ref="changePasswordDialog"/>
    <popup-layer class="light"/>
    <v-notification ref="notification">
      <!-- <template v-slot="{icon, msg}">
        <v-icon v-if="icon" :name="icon"/>
        <span v-text="msg"/>
      </template> -->
    </v-notification>
  </div>
</template>

<script>
import Vue from 'vue'
import WebsocketMessenger from '@/ws.js'
import PopupLayer from '@/ui/PopupLayer.vue'

// import Settings from '@/Settings.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import VNotification from '@/components/Notification.vue'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'
import QgisActiveIcon from '@/assets/qgis-icon32.svg'
import QgisInactiveIcon from '@/assets/qgis-icon-black32.svg'

export default {
  name: 'app',
  components: {
    PopupLayer,
    LoginDialog,
    // Settings,
    VNotification,
    ChangePasswordDialog
  },
  data () {
    return {
      initialized: false,
      ws: null
    }
  },
  computed: {
    app () {
      return this.$root.app
    },
    user () {
      return this.$root.user
    },
    showLoginDialog () {
      // return !this.$route.meta.public && !this.user
      return !this.user
    },
    pluginStatusImg () {
      return this.ws?.pluginConnected ? QgisActiveIcon : QgisInactiveIcon
    },
    clientInfo () {
      return this.ws?.clientInfo
    },
    menuItems () {
      return [
        {
          key: 'change_password',
          text: 'Change password',
          action: () => this.$refs.changePasswordDialog.show()
        }, {
          text: 'Logout',
          action: this.logout,
          icon: 'logout'
        }
      ]
    }
  },
  watch: {
    user: {
      immediate: true,
      handler (user) {
        if (user) {
          this.createWebsocketConnection()
        } else if (this.$ws) {
          this.$ws.close()
          this.$ws = null
        }
      }
    }
  },
  mounted () {
    // Vue.prototype.$notification = this.$refs.notification
    const notification = this.$refs.notification
    Vue.prototype.$notify = {
      success: notification.showSuccess,
      error: notification.showError
    }
  },
  methods: {
    logout () {
      this.$http.get('/api/auth/logout/').then(() => location.reload())
    },
    onLogin (user) {
      this.$root.user = user
    },
    createWebsocketConnection () {
      if (Vue.prototype.$ws) {
        Vue.prototype.$ws.close()
      }
      const protocol = location.protocol.endsWith('s:') ? 'wss' : 'ws'
      const ws = WebsocketMessenger(`${protocol}://${location.host}/ws/app`)
      Vue.util.defineReactive(ws, 'connected')
      Vue.util.defineReactive(ws, 'pluginConnected')
      ws.onopen().then(() => {
        this.initialized = true
      })
      this.ws = ws
      Vue.prototype.$ws = ws
    }
  }
}
</script>

<style lang="scss">
html {
  font-size: 15px;
  font-family: Roboto,sans-serif;
  line-height: 1.5;
  word-spacing: 1px;
  -ms-text-size-adjust: 100%;
  -webkit-text-size-adjust: 100%;
  -moz-osx-font-smoothing: grayscale;
  -webkit-font-smoothing: antialiased;
  -webkit-tap-highlight-color: transparent;
  height: 100%;
  // overflow: auto;
}
html, body, .app {
  height: 100%;
}

@media (min-width: 1200px) {
  html, body, .app {
    overflow: hidden;
  }
}

#app {
  min-height: 100;
}
// .app {
//   display: grid;
//   grid-template-columns: minmax(auto,1fr) auto 1fr;
//   grid-template-rows: 48px 1fr;
// }

.app {
  width: 100%;
  height: 100%;
  display: grid;
  // grid-template-columns: minmax(auto, 1fr) auto 1fr;
  grid-template-columns: minmax(auto, 1fr) minmax(auto, 1200px) 1fr;
  grid-template-rows: 48px 1fr;
  // row-gap: 6px;
  // column-gap: 1px;
  // gap: 6px;
  // gap: 1px;
  // row-gap: 1px;
  @media (max-width: 1450px) {
    grid-template-columns: auto 1fr auto;
  }
  .header-bg {
    background-color: #3d3d3d;
    grid-column: 1 / 4;
    grid-row: 1 / 2;
    // border-bottom: 1px solid #222;
    // margin-bottom: 1px;
    // box-shadow: 0 2px 7px rgba(0,0,0,0.2), 0 3px 3px rgba(0,0,0,0.15);
    box-shadow: 0 3px 3px rgba(0,0,0,0.2);
    z-index: 1;
  }
  .logo {
    grid-row: 1 / 2;
    grid-column: 1 / 2;
    max-width: 250px;
    height: 100%;
    // width: 100%;
    z-index: 1;
    img {
      height: 28px;
    }
  }
  .menu {
    grid-row: 1 / 2;
    grid-column: 2 / 3;
    display: flex;
    z-index: 1;
  }
  .app-menu {
    grid-row: 1 / 2;
    grid-column: 3 / 4;
    min-width: 92px;
    z-index: 1;
    .plugin-status {
      height: 22px;
    }
  }
}

// .app-header {
//   flex: 0 0 48px;
//   background-color: var(--color-dark);
//   .logo {
//     height: 28px;
//   }
//   .plugin-status {
//     height: 22px;
//   }
// }
.page-content {
  overflow: auto;
}
</style>
