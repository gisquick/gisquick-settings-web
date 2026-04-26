<template>
  <v-scroll-area class="service-form f-col f-grow">
    <div class="f-col px-4 py-3">

      <!-- Basic service fields -->
      <div class="section-title mb-2">Service</div>
      <div class="f-row">
        <v-text-field
          class="filled f-grow"
          label="URL *"
          v-model="service.url"
        />
        <v-select
          class="filled"
          label="Type"
          :items="serviceTypes"
          v-model="service.type"
        />
      </div>
      <v-text-field
        class="filled"
        label="Name"
        v-model="service.name"
      />

      <!-- Per-process proxy config -->
      <div class="f-row-ac mt-4 mb-2">
        <span class="section-title f-grow">Per-Process Proxy Config</span>
        <v-btn
          v-if="!isNew && service.type === 'ogcapi-processes'"
          class="small n-case"
          :disabled="syncing"
          @click="$emit('sync')"
        >
          <v-icon name="reload" class="mr-1"/>
          <span>{{ syncing ? 'Refreshing…' : 'Refresh processes' }}</span>
        </v-btn>
      </div>

      <process-block
        v-for="(proc, pi) in service._processes"
        :key="pi"
        :value="proc"
        @input="$set(service._processes, pi, $event)"
        class="mb-3"
        @remove="removeProcess(pi)"
      />

      <!-- Save / Cancel -->
      <div class="f-row mt-4">
        <v-btn
          color="primary"
          :disabled="!service.url || saving"
          @click="$emit('save')"
        >
          <v-icon name="save" class="mr-2"/>
          <span>{{ isNew ? 'Add Service' : 'Save Service' }}</span>
        </v-btn>
        <v-btn v-if="isNew" class="ml-2" @click="$emit('cancel')">
          Cancel
        </v-btn>
      </div>

    </div>
  </v-scroll-area>
</template>

<script>
import ProcessBlock from './ProcessBlock.vue'

const SERVICE_TYPES = [
  { text: 'OGC API Processes', value: 'ogcapi-processes' },
  { text: 'WPS', value: 'wps' }
]

export default {
  name: 'ProcessingServiceForm',
  components: { ProcessBlock },
  props: {
    service: {
      type: Object,
      required: true
    },
    isNew: {
      type: Boolean,
      default: false
    },
    saving: {
      type: Boolean,
      default: false
    },
    syncing: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      serviceTypes: SERVICE_TYPES
    }
  },
  methods: {
    removeProcess (index) {
      this.service._processes.splice(index, 1)
    }
  }
}
</script>

<style lang="scss" scoped>
.service-form {
  min-height: 0;
  flex: 1 1 0;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  color: #444;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
