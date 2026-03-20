<template>
  <div class="processing-view page-content f-row light">
    <div v-if="fetchTask.pending" class="f-col-ac f-grow m-4">
      <v-spinner/>
    </div>

    <template v-else>
      <services-list
        :services="services"
        :selected-index="selectedIndex"
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
        @save="saveService"
        @cancel="cancelAdd"
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
      selectedIndex: null,
      editingService: null,
      isNew: false,
      saveTask: TaskState(),
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
    selectService (index) {
      this.selectedIndex = index
      this.isNew = false
      this.editingService = serviceToEdit(this.services[index])
    },
    startAdd () {
      this.selectedIndex = null
      this.isNew = true
      this.editingService = { url: '', type: 'ogc_api_processes', name: '', _processes: [] }
    },
    cancelAdd () {
      this.isNew = false
      this.editingService = null
    },
    async saveService () {
      const body = editToService(this.editingService)
      const task = this.isNew
        ? this.$http.post(`/api/project/processing/${this.project.name}`, body)
        : this.$http.put(`/api/project/processing/${this.project.name}/${this.selectedIndex}`, body)
      const resp = await watchTask(task, this.saveTask)
      if (this.saveTask.success) {
        this.services = resp.data.services
        if (this.isNew) {
          this.selectedIndex = this.services.length - 1
          this.isNew = false
        }
        this.$notify.success('Processing service saved')
      } else {
        this.$notify.error('Failed to save processing service')
      }
    },
    async deleteService (index) {
      const resp = await watchTask(
        this.$http.delete(`/api/project/processing/${this.project.name}/${index}`),
        this.deleteTask
      )
      if (this.deleteTask.success) {
        this.services = resp.data.services
        if (this.selectedIndex === index) {
          this.selectedIndex = null
          this.editingService = null
        } else if (this.selectedIndex > index) {
          this.selectedIndex--
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
