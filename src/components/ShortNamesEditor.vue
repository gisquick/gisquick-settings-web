<template>
  <div class="short-names-editor f-col">
    <layers-table
      :collapsed.sync="collapsed"
      :columns="columns"
      :items="layersTree"
    >
      <!-- eslint-disable-next-line -->
      <template v-slot:leaf.name="{ item, value }">
        <v-text-field
          class="filled mx-0"
          v-model="names[item.id]"
          :error="invalidNames[item.id]"
          :validator="isValidLayerName"
          lazy
        >
          <template v-slot:append>
            <v-icon v-if="invalidNames[item.id]" name="warning" color="red" size="17"/>
          </template>
        </v-text-field>
      </template>

      <!-- eslint-disable-next-line -->
      <template v-slot:group.name="{ group, value }">
        <v-text-field
          class="filled mx-0"
          v-model="groupNames[group.id]"
          :error="invalidGroupNames[group.id]"
          :validator="isValidLayerName"
          lazy
        >
          <template v-slot:append>
            <v-icon v-if="invalidGroupNames[group.id]" name="warning" color="red" size="17"/>
          </template>
        </v-text-field>
      </template>

      <!-- eslint-disable-next-line -->
      <template v-slot:header.wfs>
        <th class="header">
          <div class="f-row-ac">
          <span class="mr-2">WFS</span>
          <v-icon name="visibility"/>
          <v-icon name="pencil"/>
          <v-icon name="plus"/>
          <v-icon name="delete_forever"/>
          </div>
        </th>
      </template>

      <!-- eslint-disable-next-line -->
      <template v-slot:leaf.wfs="{ item, value }">
        <div v-if="item.type === 'VectorLayer'" class="f-row-ac">
          <v-icon name="visibility"/>
          <v-icon name="pencil"/>
          <v-icon name="plus"/>
          <v-icon name="delete_forever"/>
        </div>
      </template>

    </layers-table>
    <hr class="mt-2"/>
    <div class="toolbar f-row-ac f-justify-end m-2">
      <v-btn class="outlined" @click="generateNames">Generate names</v-btn>
      <v-btn color="primary" @click="updateProject">Update QGIS project</v-btn>
    </div>
  </div>
</template>

<script>
import mapValues from 'lodash/mapValues'
import pickBy from 'lodash/pickBy'
import keyBy from 'lodash/keyBy'

import LayersTable from '@/components/LayersTable.vue'
import { isValidLayerName, layersGroups, transformLayersTree2 } from '@/utils/layers'
import { removeDiacritics } from '@/ui/utils/text'

const isAlphaNum = RegExp.prototype.test.bind(/[a-zA-Z0-9]/)

export function shortName (layername) {
  const normalized = removeDiacritics(layername).replace(/[^a-z0-9_\-\.]/gmi, ' ').replace(/\s+/g, ' ').trim()
  const parts = normalized.split(' ')
  let name = parts[0]
  parts.slice(1).forEach(p => {
    if (isAlphaNum(name.slice(-1)) && isAlphaNum(p.charAt(0))) {
      name += '_'
    }
    name += p
  })
  return name
}


export default {
  components: { LayersTable },
  props: {
    meta: Object
  },
  data () {
    return {
      collapsed: [],
      names: {},
      groupNames: {}
    }
  },
  computed: {
    layers () {
      return this.meta.layers
    },
    layersTree () {
      const { layers_tree, layers } = this.meta
      return transformLayersTree2(layers_tree, id => layers[id], (g, layers, i) => ({ ...g, layers, id: i.join(',') }))
    },
    groups () {
      return layersGroups(this.layersTree)
    },
    columns () {
      return [
        {
          text: 'Short name',
          value: 'name'
        // }, {
        //   text: 'WFS',
        //   value: 'wfs',
        //   align: 'right'
        }
      ]
    },
    isValidLayerName () {
      return v => isValidLayerName(v) ? '' : new Error()
    },
    invalidNames () {
      return mapValues(this.names, name => !isValidLayerName(name))
    },
    invalidGroupNames () {
      return mapValues(this.groupNames, name => !isValidLayerName(name))
    }
  },
  watch: {
    meta: {
      immediate: true,
      handler: 'initLayersList'
    }
  },
  methods: {
    initLayersList () {
      this.names = mapValues(this.layers, l => l.name)
      this.groupNames = this.groups.reduce((names, g) => (names[g.id] = g.wms_name || '', names), {})
    },
    generateNames () {
      Object.values(this.layers).forEach(l => {
        if (this.invalidNames[l.id]) {
          this.names[l.id] = shortName(l.name)
        }
      })
      this.groups.forEach(g => {
        if (this.invalidGroupNames[g.id]) {
          this.groupNames[g.id] = shortName(g.name)
        }
      })
    },
    async updateProject () {
      const names = pickBy(this.names, (name, id) => name !== this.layers[id].name)
      const groupsMap = keyBy(this.groups, 'id')
      const groupNames = pickBy(this.groupNames, (name, id) => name !== groupsMap[id].wms_name && (name || groupsMap[id].wms_name))
      await this.$ws.request('UpdateQgisProject', { short_names: names, groups_short_names: groupNames })
      this.$emit('project-update')
    }
  }
}
</script>

<style lang="scss" scoped>
// .grid {
//   display: grid;
//   grid-template-columns: 1fr 1fr;
//   align-self: flex-start;
//   align-items: center;
// }
.layers-table {
  // align-self: flex-start;
  .text-field {
    margin: 0;
    height: 26px;
    width: 220px;
    &.i-field > ::v-deep .input {
      height: inherit;
    }
  }
}
</style>
