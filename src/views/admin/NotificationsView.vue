<template>
  <div class="page light f-col">
    <h1>Notifications</h1>
    <div class="layout f-row">
      <div class="f-col panel box mt-2">
        <v-list
          class="flat f-grow"
          empty-text="No active notifications"
          item-text="title"
          :items="notifications"
          :selected="selectedIndex"
          @click-item="selectNotification"
        >
          <template v-slot:item="{ item }">
            <span v-if="item.title" v-text="item.title"/>
            <span v-else class="placeholder">Untitled</span>
          </template>
        </v-list>
        <hr/>
        <v-btn
          color="green"
          class="round"
          @click="addNotification"
        >
          <v-icon name="plus" class="mr-2"/>
          <span>Create</span>
        </v-btn>
      </div>
      <div v-if="notification" class="f-col f-grow">
        <div class="col-2">
          <v-text-field
            class="filled"
            label="Title"
            v-model="notification.title"
            lazy
          />
          <v-datetime-field
            color="primary"
            class="filled"
            label="Expiration"
            :min="now"
            v-model="notification.expiration"
          />
        </div>
        <div class="col-2">
          <v-select
            class="filled"
            label="Application"
            :items="appsOptions"
            v-model="notification.app"
          />
          <v-select
            class="filled"
            label="Users"
            :disabled="notification.app !== 'map'"
            :items="usersOptions"
            v-model="notification.users"
          />
        </div>
        <!-- <span v-text="notification.expiration"/> -->
        <v-text-field
          class="filled"
          label="Projects"
          placeholder="Comma separated list of projects prefixes"
          :disabled="notification.app !== 'map'"
          v-model="notification.projects"
        />
        <text-editor
          class="filled"
          label="Message"
          v-model="notification.msg"
        />
        <!-- <hr class="mx-2"/> -->
        <div class="actions f-row-ac">
          <div class="f-grow"/>
          <v-btn
            color="red"
            @click="deleteNotification"
          >
            Delete
          </v-btn>
          <v-btn
            color="primary"
            :disabled="!notificationValid"
            @click="saveNotification"
          >
            <span v-if="notification.id">Update</span>
            <span v-else>Create</span>
          </v-btn>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// import TextEditor from '@/components/TextEditor.vue'
const TextEditor = () => import('@/components/TextEditor.vue')

export default {
  components: { TextEditor },
  data () {
    return {
      selectedIndex: 0,
      notifications: [],
      time: null,
      datetime: new Date()
    }
  },
  computed: {
    now () {
      return new Date()
    },
    notification () {
      return this.notifications[this.selectedIndex]
    },
    columns () {
      return [{
        key: 'title',
        label: 'Title'
      }, {
        key: 'expiration',
        label: 'Expiration'
      }, {
        key: 'projects',
        label: 'Filter'
      }, {
        key: 'action',
        label: 'Action'
      }]
    },
    appsOptions () {
      return [
        {
          text: 'Map',
          value: 'map'
        }, {
          text: 'Settings',
          value: 'settings'
        }
      ]
    },
    usersOptions () {
      return [
        {
          text: 'All',
          value: 'all'
        }, {
          text: 'Authenticated',
          value: 'authenticated'
        }, {
          text: 'Not authenticated',
          value: 'not_authenticated'
        }, {
          text: 'Project owner',
          value: 'owner'
        }
      ]
    },
    notificationValid () {
      const { title, msg } = this.notification
      return Boolean(title && msg)
    }
  },
  mounted () {
    this.fetchNotifications()
  },
  methods: {
    async fetchNotifications () {
      const { data } = await this.$http.get('/api/admin/notifications')
      this.notifications = data
      // this.notifications = []
    },
    async saveNotification () {
      try {
        await this.$http.post('/api/admin/notification', this.notification)
        this.$notify.success('Notification saved')
      } catch (err) {
        this.$notify.error('Failed to save notification')
        return
      }
      this.fetchNotifications()
    },
    async deleteNotification () {
      if (this.notification?.id) {
        await this.$http.delete(`/api/admin/notification/${this.notification.id}`, this.form)
        this.fetchNotifications()
      } else {
        this.notifications = this.notifications.filter(n => n !== this.notification)
      }
      if (this.selectedIndex >= this.notifications.length) {
        this.selectedIndex = 0
      }
    },
    selectNotification (item, index) {
      this.selectedIndex = index
    },
    addNotification () {
      this.notifications.push({
        title: '',
        users: 'all',
        app: 'map',
        expiration: null,
        // expiration2: null,
        expiration2: '01:15 - 2023-07-06',
        msg: ''
      })
      // this.notifications.push({
      //   title: 'Test',
      //   app: ['map'],
      //   expiration: new Date('2023-06-01T16:30:00.000Z'),
      //   msg: 'test'
      // })
      this.selectedIndex = this.notifications.length - 1
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  max-width: 1200px;
  @media (min-width: 601px) {
    padding: 8px;
  }
}
.layout {
  gap: 4px;
  .text-editor :deep(.input) {
    min-height: 200px;
  }
}
.col-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
}
.panel {
  min-width: 250px;
  min-height: 300px;
  background-color: #fff;
}
.box {
  border: 1px solid #ccc;
  // border-radius: 3px;
}
.actions {
  .btn {
    min-width: 120px;
  }
}
.list {
  .placeholder {
    opacity: 0.7;
  }
}
</style>
