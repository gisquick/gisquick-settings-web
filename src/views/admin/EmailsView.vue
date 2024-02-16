<template>
  <div class="page light f-col">
    <h1>Emails</h1>
    <div class="form f-col">
      <v-select
        class="filled"
        label="Recepients"
        :items="recepientsOptions"
        v-model="recepientsOption"
      />
      <users-list
        v-if="recepientsOption === 'selected_users'"
        label="Recepients"
        :task="tasks.users"
        v-model="recepients"
      >
        <template v-slot:list-item="{ user }">
          <span class="f-grow">{{ user.full_name || user.username }} &lt;{{ user.email }}&gt;</span>
        </template>
      </users-list>
      <!-- <v-autocomplete
        multi
        class="filled"
        :items="tasks.users.data"
        item-text="username"
        item-value="username"
        v-model="recepients"
      >
        <template v-slot:item="{ item }">
          <span>{{ item.username }}</span>
        </template>
      </v-autocomplete> -->
      <v-text-field
        class="filled"
        label="Subject"
        v-model="subject"
      />
      <div class="f-row f-align-end">
        <v-file-field
          class="filled f-grow"
          label="HTML templates"
          accept=".html, .txt, .css"
          multiple
          placeholder="Select files"
          v-model="templates"
        />
      </div>
      <div v-if="previewData" class="preview-field f-col m-2">
        <div class="f-row f-align-end">
          <span class="label">Preview</span>
          <span class="f-grow"/>
          <tabs-header class="m-0" :items="typeTabs" v-model="previewType"/>
        </div>
        <Preview
          v-if="previewType === 'html'"
          class="preview html"
          :content="previewData.html"
        />
        <div v-else class="preview text p-2" v-text="previewData.text"/>
      </div>
      <div class="actions f-row-ac f-justify-end">
        <v-btn
          class="round"
          color="green"
          :disabled="!formValid"
          @click="sendEmail"
        >
          Send
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script>
import { extname } from 'path'
import TabsHeader from '@/ui/TextTabsHeader.vue'
import VAutocomplete from '@/ui/Autocomplete.vue'
import UsersList from '@/components/UsersList.vue'
import { TaskState, watchTask } from '@/tasks'

function readFile (file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.addEventListener('load', () => resolve(reader.result), false)
    if (file) {
      reader.readAsText(file)
    }
  })
}

function fullName (user) {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  return user.first_name || user.last_name
}

const Preview = {
  props: {
    content: String,
  },
  mounted () {
    this.update()
    const frame = this.$el
    frame.style.height = frame.contentWindow.document.scrollingElement.scrollHeight + 2 + 'px'
    // frame.onload = function (e) {
    //   frame.style.height = frame.contentWindow.document.scrollingElement.scrollHeight + 2 + 'px'
    // }
  },
  watch: {
    content () {
      this.update()
    }
  },
  render (h) {
    return h('iframe')
  },
  methods: {
    update () {
      const doc = this.$el.contentDocument
      doc.write(this.content)
      doc.close()
    }
  }
}

const FormatFields = {
  html: 'html_template',
  txt: 'text_template',
  css: 'style'
}

export default {
  components: { VAutocomplete, Preview, TabsHeader, UsersList },
  data () {
    return {
      subject: '',
      templates: null,
      recepients: [],
      recepientsOption: 'active_users',
      previewData: null,
      previewType: 'html',
      tasks: {
        users: TaskState()
      }
    }
  },
  computed: {
    typeTabs () {
      return [
        { label: 'HTML', key: 'html' },
        { label: 'Text', key: 'text' }
      ]
    },
    recepientsOptions () {
      return [{
        text: 'All active users',
        value: 'active_users'
      }, {
        text: 'Selected users',
        value: 'selected_users'
      }]
    },
    formValid () {
      return Boolean(this.subject && this.templates?.length)
    }
  },
  watch: {
    templates (templates) {
      if (templates?.length) {
        this.getEmailPreview()
      } else {
        this.previewData = null
      }
    }
  },
  mounted () {
    this.fetchUsers()
  },
  methods: {
    async fetchUsers () {
      const setFullName = u => {
        u.full_name = fullName(u)
      }
      const task = this.$http.get('/api/admin/users').then(resp => {
        resp.data = resp.data.filter(u => u.email)
        resp.data.forEach(setFullName)
        return resp
      })
      watchTask(task, this.tasks.users)
    },
    async getEmailPreview () {
      const texts = await Promise.all(this.templates.map(f => readFile(f)))
      const params = {}
      this.templates.forEach((f, i) => {
        const ext = extname(f.name).toLowerCase().slice(1)
        const field = FormatFields[ext]
        if (field) {
          params[field] = texts[i]
        }
      })
      const { data } = await this.$http.post('/api/admin/email_preview', params)
      this.previewData = data
    },
    async sendEmail () {
      const texts = await Promise.all(this.templates.map(f => readFile(f)))
      const params = {
        subject: this.subject
      }
      if (this.recepientsOption === 'active_users') {
        params.users_filter = 'active'
      } else {
        params.users = this.recepients
      }
      this.templates.forEach((f, i) => {
        const ext = extname(f.name).toLowerCase().slice(1)
        const field = FormatFields[ext]
        if (field) {
          params[field] = texts[i]
        }
      })
      console.log(params)
      const { data } = await this.$http.post('/api/admin/email', params)
      console.log(data)
    }
  }
}
</script>

<style lang="scss" scoped>
.page {
  @media (min-width: 601px) {
    padding: 8px;
  }
}
.preview-field {
  .label {
    text-transform: uppercase;
    font-size: 11.5px;
    font-weight: 500;
    opacity: 0.75;
  }
}
.preview {
  border: 1px solid #ddd;
  background-color: #fff;
  margin-block: 6px;
  width: 100%;
  &.text {
    white-space: pre-wrap;
    word-break: break-word;
    overflow: hidden;
  }
}
.form {
  width: clamp(300px, 800px, 100%);
  align-self: flex-start;
  .actions {
    .btn:not(.icon) {
      min-width: 130px;
    }
  }
}

.text-tabs-header {
  align-self: flex-end;
  :deep(.tab) {
    display: flex;
    align-items: center;
    height: 24px;
    min-width: 45px;
  }
}
</style>
