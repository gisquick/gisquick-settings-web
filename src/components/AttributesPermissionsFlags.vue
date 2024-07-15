<template>
  <div class="flags f-row-ac">
    <v-checkbox
      :disabled="!layerQueryable"
      v-bind="visibilityStatus"
      @input="toggleFlag('view', $event)"
    />
    <v-checkbox
      :disabled="!layerExportable"
      v-bind="exportStatus"
      @input="toggleFlag('export', $event)"
    />
    <v-checkbox
      :disabled="!layerEditable"
      v-bind="editStatus"
      @input="toggleFlag('edit', $event)"
    />
  </div>
</template>

<script>
import pick from 'lodash/pick'
import pickBy from 'lodash/pickBy'
import { extend, pull, hasAny } from '@/utils/collections'

export default {
  props: {
    layer: Object,
    layerCapabilities: Object,
    layerPermissions: Array,
    layerSettings: Object,
    values: Object
  },
  computed: {
    visibilityStatus () {
      return this.getFlagStatus('view')
    },
    editStatus () {
      return this.getFlagStatus('edit')
    },
    exportStatus () {
      return this.getFlagStatus('export')
    },
    layerQueryable () {
      return this.layerPermissions.includes('view') && this.layerPermissions.includes('query')
    },
    layerEditable () {
      return this.layerQueryable && hasAny(this.layerPermissions, 'update', 'insert', 'delete')
    },
    layerExportable () {
      return this.layerQueryable && this.layerPermissions.includes('export')
    },
    editableFields () {
      if (this.layerEditable) {
        return this.layer.attributes
          .filter(attr => !attr.constraints?.includes('readonly') && this.values[attr.name].includes('view'))
          .map(attr => attr.name)
      }
      return []
    },
    exportableFields () {
      if (this.layerExportable) {
        // return this.layer.attributes
        //   .filter(attr => this.layerSettings.export_fields?.includes(attr.name) && this.values[attr.name].includes('view'))
        //   .map(attr => attr.name)
        return Object.keys(this.values).filter(field => this.layerSettings.export_fields?.includes(field) && this.values[field].includes('view'))
      }
      return []
    },
    attrValues () {
      return pickBy(this.values, (_, k) => k !== 'geometry')
    }
  },
  methods: {
    getFlagStatus (flag) {
      const values = Object.values(this.attrValues)
      const visible = values.filter(v => v.includes(flag)).length
      return {
        value: visible === 0 ? false : true,
        indeterminate: visible > 0 && visible !== values.length
      }
    },
    toggleFlag (flag, value) {
      let values = this.attrValues
      if (value) {
        if (flag === 'edit') {
          values = pick(values, this.editableFields)
        } else if (flag === 'export') {
          values = pick(values, this.exportableFields)
        }
        Object.values(values).forEach(v => extend(v, flag))
      } else {
        if (flag === 'view') {
          Object.values(values).forEach(v => pull(v, 'view', 'edit', 'export'))
        } else {
          Object.values(values).forEach(v => pull(v, flag))
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.flags {
  .checkbox {
    margin: 0 6px;
  }
}
</style>
