<template>
  <div class="flags f-row-ac">
    <v-btn
      v-for="flag in flags"
      :key="flag.name"
      :disabled="flag.disabled"
      class="icon flat"
      :color="flag.value ? 'primary' : '#777'"
      @click="toggle(flag)"
    >
      <v-icon :name="flag.icon"/>
    </v-btn>
  </div>
</template>

<script>
import { hasAny, pull } from '@/utils/collections'

export default {
  props: {
    attributeMeta: Object,
    layerCapabilities: Object,
    layerPermissions: Array,
    layerSettings: Object,
    value: Array
  },
  computed: {
    readonlyConstrain () {
      return this.attributeMeta.constraints?.includes('readonly')
    },
    flags () {
      const attrVisible = this.value.includes('view')
      const attrExportable = this.layerSettings.export_fields?.includes(this.attributeMeta.name)
      const layerQueryable = this.layerPermissions.includes('view') && this.layerPermissions.includes('query')
      const layerEditable = layerQueryable && hasAny(this.layerPermissions, 'update', 'insert', 'delete')
      const layerExportable = layerQueryable && this.layerPermissions.includes('export')
      return [
        {
          name: 'view',
          icon: 'visibility',
          disabled: !this.layerCapabilities.view || !layerQueryable,
          value: attrVisible
        }, {
          name: 'export',
          icon: 'download',
          disabled: !this.layerCapabilities.export || !layerExportable || !attrExportable || !attrVisible,
          value: this.value.includes('export')
        }, {
          name: 'edit',
          icon: 'pencil',
          disabled: this.readonlyConstrain || !this.layerCapabilities.edit || !layerEditable || !attrVisible,
          value: this.value.includes('edit')
        }
      ]
    }
  },
  methods: {
    toggle (flag) {
      const { name, value } = flag
      if (!value) {
        this.value.push(name)
      } else if (name === 'view') {
        pull(this.value, 'view', 'edit', 'export')
      } else {
        pull(this.value, name)
      }
    }
  }
}
</script>
