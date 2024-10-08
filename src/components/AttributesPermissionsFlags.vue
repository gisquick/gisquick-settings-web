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

function editableFields (layer, values) {
  return layer.attributes
    .filter(attr => !attr.constraints?.includes('readonly') && values[attr.name].includes('view'))
    .map(attr => attr.name)
}

function exportableFields (layerSettings, values) {
  return Object.keys(values).filter(field => layerSettings.export_fields?.includes(field) && values[field].includes('view'))
}

export function toggleAttributePermissionsFlag (values, flag, value, layer, layerSettings, layerPermissions) {
  if (value) {
    const layerQueryable = layerPermissions.includes('view') && layerPermissions.includes('query')
    if (flag === 'edit') {
      const layerEditable = layerQueryable && hasAny(layerPermissions, 'update', 'insert', 'delete')
      values = layerEditable ? pick(values, editableFields(layer, values).concat('geometry')) : []
    } else if (flag === 'export') {
      const layerExportable = layerQueryable && layerPermissions.includes('export')
      values = layerExportable ? pick(values, exportableFields(layerSettings, values)) : []
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
      toggleAttributePermissionsFlag(this.attrValues, flag, value, this.layer, this.layerSettings, this.layerPermissions)
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
