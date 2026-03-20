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
        :value="proc._key"
        @input="proc._key = $event"
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
            v-model="proc.remote.execute_url"
          />
          <v-text-field
            class="filled"
            label="Method"
            placeholder="POST"
            v-model="proc.remote.method"
          />
          <v-select
            class="filled"
            label="Type override"
            :items="remoteTypeItems"
            :value="proc.remote.type || null"
            @input="proc.remote.type = $event || ''"
          />
        </div>
        <div class="f-row">
          <v-text-field
            class="filled f-grow"
            label="Status URL"
            placeholder="Optional (async)"
            v-model="proc.remote.status_url"
          />
          <v-text-field
            class="filled f-grow"
            label="Result URL"
            placeholder="Optional (async)"
            v-model="proc.remote.result_url"
          />
        </div>
        <div class="f-row-ac mb-1 mt-1">
          <span class="field-label f-grow">Headers</span>
          <v-btn class="icon small" @click="proc.remote.headers.push({ key: '', value: '' })">
            <v-icon name="plus" size="14"/>
          </v-btn>
        </div>
        <div
          v-for="(h, hi) in proc.remote.headers"
          :key="'h' + hi"
          class="f-row f-align-end mb-1"
        >
          <v-text-field class="filled" label="Key" v-model="h.key"/>
          <v-text-field class="filled f-grow" label="Value" v-model="h.value"/>
          <v-btn class="icon small" @click="proc.remote.headers.splice(hi, 1)">
            <v-icon name="delete_forever" size="14"/>
          </v-btn>
        </div>

        <!-- Execution -->
        <div class="subsection-title mt-3">Execution</div>
        <div class="f-row f-align-end">
          <v-checkbox label="Async" v-model="proc.execution.async" class="mr-4"/>
          <v-text-field
            class="filled"
            label="Poll interval (s)"
            type="number"
            v-model="proc.execution.poll_interval_seconds"
          />
          <v-text-field
            class="filled"
            label="Timeout (s)"
            type="number"
            v-model="proc.execution.timeout_seconds"
          />
        </div>

        <!-- Project inputs -->
        <div class="f-row-ac mt-3 mb-1">
          <span class="subsection-title f-grow">Project Inputs</span>
          <v-btn class="icon small" @click="addInput">
            <v-icon name="plus" size="14"/>
          </v-btn>
        </div>
        <div
          v-for="(inp, ii) in proc.project_inputs"
          :key="'inp' + ii"
          class="input-block mb-2 px-2 py-2"
        >
          <div class="f-row f-align-end mb-1">
            <v-text-field class="filled" label="Input ID" v-model="inp.input_id"/>
            <v-select
              class="filled"
              label="Source"
              :items="inputTypes"
              v-model="inp._type"
            />
            <v-btn class="icon small" @click="proc.project_inputs.splice(ii, 1)">
              <v-icon name="delete_forever" size="14"/>
            </v-btn>
          </div>
          <template v-if="inp._type === 'layer'">
            <v-text-field class="filled" label="Layer name/ID" v-model="inp.layer"/>
            <div class="f-row">
              <v-text-field
                class="filled"
                label="Selection mode"
                placeholder="expression"
                v-model="inp.selection_mode"
              />
              <v-text-field
                class="filled f-grow"
                label="Selection expression"
                placeholder='e.g. "active" = 1'
                v-model="inp.selection_expression"
              />
            </div>
            <div class="f-row f-align-end">
              <v-text-field
                class="filled"
                label="Encoding format"
                placeholder="geojson"
                v-model="inp.encoding_format"
              />
              <v-checkbox label="Geometry only" v-model="inp.encoding_geometry_only"/>
            </div>
          </template>
          <template v-else>
            <v-text-field
              class="filled f-grow"
              label="Value (JSON literal)"
              placeholder='e.g. 7 or "hello" or [1,2,3]'
              v-model="inp.value_str"
            />
          </template>
        </div>

        <!-- Payload bindings -->
        <div class="f-row-ac mt-3 mb-1">
          <span class="subsection-title f-grow">Payload Bindings</span>
          <v-btn class="icon small" @click="proc.payload_bindings.push({ key: '', value: '' })">
            <v-icon name="plus" size="14"/>
          </v-btn>
        </div>
        <div
          v-for="(b, bi) in proc.payload_bindings"
          :key="'b' + bi"
          class="f-row f-align-end mb-1"
        >
          <v-text-field class="filled" label="Input ID" v-model="b.key"/>
          <v-icon name="arrow-right" size="14" class="mx-1"/>
          <v-text-field class="filled f-grow" label="Payload path" v-model="b.value"/>
          <v-btn class="icon small" @click="proc.payload_bindings.splice(bi, 1)">
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
    proc: {
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
      remoteTypeItems: [
        { text: '(Inherit from service)', value: null },
        { text: 'OGC API Processes', value: 'ogc_api_processes' },
        { text: 'WPS', value: 'wps' }
      ],
      inputTypes: [
        { text: 'Layer', value: 'layer' },
        { text: 'Scalar value', value: 'value' }
      ]
    }
  },
  methods: {
    addInput () {
      this.proc.project_inputs.push({
        input_id: '',
        _type: 'layer',
        layer: '',
        selection_mode: '',
        selection_expression: '',
        encoding_format: '',
        encoding_geometry_only: false,
        value_str: ''
      })
    }
  }
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
