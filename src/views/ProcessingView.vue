<template>
  <div class="processing-view page-content f-row light">
    <div v-if="fetchTask.pending" class="f-col-ac f-grow m-4">
      <v-spinner/>
    </div>

    <template v-else>
      <services-list
        :services="services"
        :selected-id="selectedId"
        :is-new="isNew"
        @select="selectService"
        @add="startAdd"
        @delete="deleteService"
      />

      <service-form
        v-if="editingService"
        :service="editingService"
        :is-new="isNew"
        :saving="saveTask.pending"
        :syncing="syncTask.pending"
        @save="saveService"
        @cancel="cancelAdd"
        @sync="syncService"
      />

      <div v-else class="f-col-ac f-grow m-4">
        <span class="hint-text">Select a service or add a new one</span>
      </div>
    </template>
  </div>
</template>

<script>
import { TaskState, watchTask } from '@/tasks'
import { serviceToEdit, editToService } from '@/utils/processing'
import ServicesList from '@/components/processing/ServicesList.vue'
import ServiceForm from '@/components/processing/ServiceForm.vue'

export default {
  name: 'ProcessingView',
  components: { ServicesList, ServiceForm },
  props: {
    project: Object,
    settings: Object
  },
  data () {
    return {
      fetchTask: TaskState(),
      services: [],
      selectedId: null,
      editingService: null,
      isNew: false,
      saveTask: TaskState(),
      syncTask: TaskState(),
      deleteTask: TaskState()
    }
  },
  created () {
    this.loadConfig()
  },
  methods: {
    async loadConfig () {
      const resp = await watchTask(
        this.$http.get(`/api/project/processing/${this.project.name}`),
        this.fetchTask
      )
      if (this.fetchTask.success && resp.data?.services) {
        this.services = resp.data.services
      }
    },
    selectService (id) {
      this.selectedId = id
      this.isNew = false
      this.editingService = serviceToEdit(this.services.find(s => s.id === id))
    },
    startAdd () {
      this.selectedId = null
      this.isNew = true
      this.editingService = { url: '', type: 'ogcapi-processes', name: '', _headers: [], _processes: [] }
    },
    cancelAdd () {
      this.isNew = false
      this.editingService = null
    },
    async saveService () {
      const body = editToService(this.editingService)
      const task = this.isNew
        ? this.$http.post(`/api/project/processing/${this.project.name}`, body)
        : this.$http.put(`/api/project/processing/${this.project.name}/${this.selectedId}`, body)
      const resp = await watchTask(task, this.saveTask)
      if (this.saveTask.success) {
        const oldIds = new Set(this.services.map(s => s.id))
        this.services = resp.data.services
        if (this.isNew) {
          const added = this.services.find(s => !oldIds.has(s.id))
          if (added) this.selectedId = added.id
          this.isNew = false
          this.editingService = serviceToEdit(added || this.services[0])
        }
        this.$notify.success('Processing service saved')
      } else {
        this.$notify.error('Failed to save processing service')
      }
    },
    async syncService () {
      const resp = await watchTask(
        this.$http.post(`/api/project/processing/${this.project.name}/${this.selectedId}/sync`),
        this.syncTask
      )
      if (this.syncTask.success) {
        this.services = resp.data.services
        this.editingService = serviceToEdit(this.services.find(s => s.id === this.selectedId))
        this.$notify.success('Processes refreshed from remote')
      } else {
        this.$notify.error('Failed to refresh processes from remote')
      }
    },
    async deleteService (id) {
      const resp = await watchTask(
        this.$http.delete(`/api/project/processing/${this.project.name}/${id}`),
        this.deleteTask
      )
      if (this.deleteTask.success) {
        this.services = resp.data.services
        if (this.selectedId === id) {
          this.selectedId = null
          this.editingService = null
        }
        this.$notify.success('Processing service removed')
      } else {
        this.$notify.error('Failed to remove processing service')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.hint-text {
  color: #999;
  font-style: italic;
}
</style>
