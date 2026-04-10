<template>
  <div class="process-block">
    <div class="process-header f-row-ac px-2" @click="expanded = !expanded">
      <v-icon
        :name="expanded ? 'arrow-down' : 'arrow-right'"
        size="14"
        class="mr-2 toggle-icon"
      />
      <v-text-field
        class="process-id-field"
        placeholder="process-id"
        :value="localProc._key"
        @input="localProc._key = $event"
        @click.stop
      />
      <div class="f-grow"/>
      <v-btn class="icon small" @click.stop="$emit('remove')">
        <v-icon name="delete_forever" size="16"/>
      </v-btn>
    </div>

    <v-collapsible>
      <div v-if="expanded" class="process-body px-3 py-2">

        <!-- Remote -->
        <div class="subsection-title">Remote</div>
        <div class="f-row">
          <v-text-field
            class="filled f-grow"
            label="Execute URL"
            placeholder="Default: {url}/processes/{id}/execution"
            v-model="localProc.remote.execute_url"
          />
          <v-text-field
            class="filled"
            label="Method"
            placeholder="POST"
            v-model="localProc.remote.method"
          />
          <v-select
            class="filled"
            label="Type override"
            :items="remoteTypeItems"
            :value="localProc.remote.type || null"
            @input="localProc.remote.type = $event || ''"
          />
        </div>
        <div class="f-row">
          <v-text-field
            class="filled f-grow"
            label="Status URL"
            placeholder="Optional (async)"
            v-model="localProc.remote.status_url"
          />
          <v-text-field
            class="filled f-grow"
            label="Result URL"
            placeholder="Optional (async)"
            v-model="localProc.remote.result_url"
          />
        </div>
        <div class="f-row-ac mb-1 mt-1">
          <span class="field-label f-grow">Headers</span>
          <v-btn class="icon small" @click="localProc.remote.headers.push({ key: '', value: '' })">
            <v-icon name="plus" size="14"/>
          </v-btn>
        </div>
        <div
          v-for="(h, hi) in localProc.remote.headers"
          :key="'h' + hi"
          class="f-row f-align-end mb-1"
        >
          <v-text-field class="filled" label="Key" v-model="h.key"/>
          <v-text-field class="filled f-grow" label="Value" v-model="h.value"/>
          <v-btn class="icon small" @click="localProc.remote.headers.splice(hi, 1)">
            <v-icon name="delete_forever" size="14"/>
          </v-btn>
        </div>

      </div>
    </v-collapsible>
  </div>
</template>

<script>
export default {
  name: 'ProcessingProcessBlock',
  props: {
    value: {
      type: Object,
      required: true
    },
    initiallyExpanded: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      expanded: this.initiallyExpanded,
      localProc: JSON.parse(JSON.stringify(this.value)),
      remoteTypeItems: [
        { text: '(Inherit from service)', value: null },
        { text: 'OGC API Processes', value: 'ogcapi-processes' },
        { text: 'WPS', value: 'wps' }
      ],
    }
  },
  watch: {
    localProc: {
      deep: true,
      handler (val) {
        this.$emit('input', val)
      }
    }
  },
}
</script>

<style lang="scss" scoped>
.process-block {
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.process-header {
  height: 38px;
  background-color: #eee;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid #ddd;
  &:hover {
    background-color: #e4e4e4;
  }
}

.toggle-icon {
  flex-shrink: 0;
}

.process-id-field {
  font-size: 13.5px;
  font-weight: 500;
  ::v-deep .input-field {
    border: none;
    background: transparent;
    font-weight: 500;
  }
}

.process-body {
  background-color: #fafafa;
}

.subsection-title {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #666;
  margin-bottom: 4px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
}

.input-block {
  border: 1px solid #e0e0e0;
  border-radius: 3px;
  background-color: #fff;
}
</style>
