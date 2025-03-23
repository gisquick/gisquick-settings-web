<template>
  <div class="app">
    <div class="app-panel shadow-2 f-col dark">
      <router-link class="logo f-row-ac p-4" to="/">
        <img src="@/assets/text_logo_dark.svg"/>
      </router-link>
      <nav class="list f-grow f-col my-2">
        <router-link class="item" :to="{name: 'users'}">
          <v-icon name="users"/>
          <span>Users</span>
        </router-link>
        <router-link class="item" :to="{name: 'emails'}">
          <v-icon name="mail"/>
          <span>Emails</span>
        </router-link>
        <router-link class="item" :to="{name: 'notifications'}">
          <v-icon name="notification"/>
          <span>Notifications</span>
        </router-link>
        <a class="item" href="/admin/grafana/">
          <!-- <v-icon name="chart"/> -->
          <v-icon name="grafana"/>
          <span>Grafana</span>
        </a>

        <router-link
          v-if="app.qgis_server_man"
          class="item"
          :to="{name: 'qgis-servers'}"
        >
          <v-icon name="qgis"/>
          <span>QGIS Servers</span>
        </router-link>
      </nav>
      <hr/>
      <div class="list f-col">
        <v-btn class="item" @click="logout">
          <v-icon name="logout"/>
          <span>Logout</span>
        </v-btn>
      </div>
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
import PopupLayer from '@/ui/PopupLayer.vue'

// import Settings from '@/Settings.vue'
import LoginDialog from '@/components/LoginDialog.vue'
import VNotification from '@/components/Notification.vue'
import ChangePasswordDialog from '@/components/ChangePasswordDialog.vue'

export default {
  name: 'app',
  components: {
    PopupLayer,
    LoginDialog,
    // Settings,
    VNotification,
    ChangePasswordDialog
  },
  computed: {
    app () {
      return this.$root.app
    },
    user () {
      return this.$root.user
    },
    showLoginDialog () {
      return !this.user?.is_superuser
    },
    pluginStatusImg () {
      return this.ws?.pluginConnected ? require('./assets/qgis-icon32.svg') : require('./assets/qgis-icon-black32.svg')
    },
    clientInfo () {
      return this.ws?.clientInfo
    },
    menuItems () {
      return [
        {
          key: 'users',
          text: 'Users',
          link: '/'
        },
        {
          key: 'change_password',
          text: 'Change password',
          action: () => this.$refs.changePasswordDialog.show()
        }, {
          text: 'Logout',
          action: this.logout
        }
      ]
    }
  },
  created () {
    if (this.user?.is_superuser) {
      this.fetchConfig()
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
      this.fetchConfig()
    },
    async fetchConfig () {
      const { data } = await this.$http.get('/api/admin/config/')
      this.$root.app = { ...this.$root.app, ...data }
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
  overflow: hidden;
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
  grid-template-columns: auto 1fr;
  background-color: #eee;
  h1 {
    font-size: 22px;
    margin-inline: 6px;
    margin-block: 0 6px;
  }
  .app-panel {
    width: 260px;
    background-color: #3d3d3d;
    // border-bottom: 1px solid #222;
    // margin-bottom: 1px;
    // box-shadow: 0 2px 7px rgba(0,0,0,0.2), 0 3px 3px rgba(0,0,0,0.15);
    --border-color: rgba(255, 255, 255, 0.2);
    z-index: 1;
  }
  .logo {
    max-width: 250px;
    z-index: 1;
    img {
      height: 28px;
    }
  }
}

.page-content {
  overflow: auto;
}
.list {
  .item {
    padding: 0 6px;
    min-height: 36px;
    display: flex;
    align-items: center;
    cursor: pointer;
    outline: none;
    text-decoration: none;
    // font-weight: bold;
    color: inherit;

    transition: all .2s cubic-bezier(.25,.8,.25,1);
    --icon-color: currentColor;
    &:hover {
      background-color: #4d4d4d;
    }
    &.active {
      background-color: #eee;
    }
    &.router-link-active {
      color: var(--color-yellow);
    }
    .icon {
      margin-right: 8px;
    }
  }
}

</style>
