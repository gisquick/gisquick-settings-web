<template>
  <div class="layers-settings page-content light">
    <!-- <portal to="menu">
      <span>Layers</span>
    </portal> -->
    <span class="label">Base Layers</span>
    <span class="label">Overlays</span>
    <layers-table
      class="base-layers"
      :items="baseLayers"
      :columns="baseLayersColumns"
      :collapsed.sync="collapsed.baseLayers"
      :selected="selected"
      :label-render-data="dragEvents"
      @click:row="onClick"
      @dragover.native.prevent="onLayerDragOver"
      @drop.native="onLayerDrop(baseLayers)"
    >
      <!-- eslint-disable-next-line -->
      <template v-slot:leaf.settings="{ item }">
        <v-btn class="icon flat mx-auto" :to="`layers/settings/${item.id}`">
          <v-icon name="settings"/>
        </v-btn>
      </template>
    </layers-table>
    <layers-table
      class="overlays"
      :items="overlays"
      :columns="overlaysColumns"
      :collapsed.sync="collapsed.overlays"
      :selected="selected"
      :label-render-data="dragEvents"
      @click:row="onClick"
      @dragover.native.prevent="onLayerDragOver"
      @drop.native="onLayerDrop(overlays)"
    >
      <!-- eslint-disable-next-line -->
      <template v-slot:group.flags="{ group }">
        <group-settings
          v-if="group.wms_name"
          :value="groupsSettings[group.wms_name]"
          @input="updateGroupSetting(group, $event)"
        />
      </template>

      <!-- eslint-disable-next-line -->
      <template v-slot:leaf.flags="{ item }">
        <layer-flags
          class="flags m-0"
          :layer-meta="item"
          :layer-settings="settings.layers[item.id]"
        />
      </template>

      <!-- eslint-disable-next-line -->
      <template v-slot:leaf.attributes="{ item }">
        <v-btn
          v-if="item.attributes"
          class="icon flat mx-auto"
          :disabled="!item.flags.includes('query')"
          :to="`layers/attributes/${item.id}`"
        >
          <v-icon name="attribute-table" size="18"/>
        </v-btn>
      </template>

      <!-- eslint-disable-next-line -->
      <template v-slot:leaf.settings="{ item }">
        <v-btn
          class="icon flat mx-auto"
          :to="`layers/settings/${item.id}`"
        >
          <v-icon name="settings"/>
        </v-btn>
      </template>

      <!-- eslint-disable-next-line -->
      <!-- <template v-slot:leaf.publish="{ item }">
        <v-checkbox
          class="f-justify-center"
          v-model="settings.layers[item.id].publish"
        />
      </template> -->
    </layers-table>
    <small class="switch f-row-ac m-1">
      <v-icon name="circle-i-outline" class="m-1" size="16"/>
      <span>Drag top level items to change layers category</span>
    </small>
  </div>
</template>

<script>
import LayerFlags from '@/components/LayerFlags.vue'
import LayersTable from '@/components/LayersTable.vue'
import GroupSettings from '@/components/GroupSettings.vue'
import { layersGroups, transformLayersTree } from '@/utils/layers'
import { pull } from '@/utils/collections'

export default {
  name: 'ProjectLayers',
  components: { LayerFlags, LayersTable, GroupSettings },
  props: {
    project: Object,
    settings: Object
  },
  data () {
    return {
      opened: {
        baseLayers: [],
        overlays: []
      },
      collapsed: {
        baseLayers: [],
        overlays: []
      },
      selected: null
    }
  },
  computed: {
    baseLayersColumns () {
      return [{
        text: 'Settings',
        value: 'settings',
        header: { width: 1 },
        align: 'center'
      }]
    },
    overlaysColumns () {
      return [
        {
          text: 'Flags',
          value: 'flags',
          align: 'right'
        }, {
        //   text: 'Attributes',
        //   value: 'attributes'
        // }, {
          text: 'Settings',
          value: 'settings'
        }
      ]
    },
    baseLayers () {
      const meta = this.project.meta
      const tree = meta.layers_tree.filter(i => this.settings.base_layers.includes(i.id || i.name))
      return transformLayersTree(
        tree,
        l => ({ ...meta.layers[l.id] }),
        (g, layers) => ({ name: g.name, layers })
      )
    },
    // overlays () {
    //   const meta = this.project.meta
    //   const overlaysTree = meta.layers_tree.filter(i => this.settings.overlays.includes(i.id || i.name))
    //   return transformLayersTree(
    //     overlaysTree,
    //     l => ({ ...meta.layers[l.id] }),
    //     (g, layers) => ({ name: g.name, layers })
    //   )
    // },
    overlays () {
      const meta = this.project.meta
      const overlaysTree = meta.layers_tree.filter(i => !this.settings.base_layers.includes(i.id || i.name))
      return transformLayersTree(
        overlaysTree,
        l => ({ ...meta.layers[l.id] }),
        (g, layers) => ({ name: g.name, layers, wms_name: g.wms_name })
      )
    },
    groupsInfo () {
      const tree = this.project.meta.layers_tree
      return tree
        .filter(n => n.layers)
        .reduce((data, g) => (data[g.name] = layersGroups(g.layers).map(sg => sg.name), data), {})
    },
    groupsSettings () {
      return this.settings.groups || {}
    },
    dragEvents () {
      return {
        attrs: {
          draggable: 'true'
        },
        on: {
          dragstart: (e, item) => {
            const key = item.id || item.name
            const isTopLevelItem = this.project.meta.layers_tree.some(i => (i.id || i.name) === key)
            if (isTopLevelItem) {
              this.dragLayer = item
               e.dataTransfer.effectAllowed = 'move'
            } else {
               e.dataTransfer.effectAllowed = 'none'
            }
            // e.dataTransfer.effectAllowed = isTopLevelItem ? 'move' : 'none'
          },
          dragend: () => {
            this.dragLayer = null
          }
        }
      }
    }
  },
  methods: {
    onClick (item) {
      const key = item.id || item.name
      if (this.project.meta.layers_tree.some(i => (i.id || i.name) === key)) {
        // this.selected = key
      }
    },
    onLayerDragOver (e) {
      // e.dataTransfer.dropEffect = this.dragLayer ? 'move' : 'none'
      // ev.dataTransfer.effectAllowed = "move"
    },
    onLayerDrop (targetList) {
      if (this.dragLayer && !targetList.includes(this.dragLayer)) {
        this.swapLayer(this.dragLayer)
      }
    },
    // swapSelectedLayer () {
    //   const { base_layers: base, overlays } = this.settings
    //   const selector = i => (i.id || i.name) === this.selected
    //   const isOverlay = this.overlays.some(selector)
    //   const [ src, dest ] = isOverlay ? [overlays, base] : [base, overlays]
    //   dest.push(this.selected)
    //   pull(src, this.selected)

    //   // update opened groups models
    //   const isGroup = !!this.project.meta.layers_tree.find(selector).layers
    //   if (isGroup) {
    //     const [sOpen, dOpen] = isOverlay ? Object.values(this.opened).reverse() : Object.values(this.opened)
    //     const opened = sOpen.filter(name => name === this.selected || this.groupsInfo[this.selected].includes(name))
    //     dOpen.push(...opened)
    //     pull(sOpen, ...opened)
    //   }
    // },
    swapLayer (layer) {
      const key = layer.id || layer.name
      const { base_layers: base } = this.settings
      const isBaseLayer = base.includes(key)
      if (isBaseLayer) {
        pull(base, key)
      } else {
        base.push(key)
      }

      // update collapsed groups models
      const isGroup = !!this.project.meta.layers_tree.find(i => (i.id || i.name) === key)?.layers
      if (isGroup) {
        const [sList, dList] = isBaseLayer ? Object.values(this.collapsed) : Object.values(this.collapsed).reverse()
        const collapsed = sList.filter(name => name === key || this.groupsInfo[key].includes(name))
        dList.push(...collapsed)
        pull(sList, ...collapsed)
      }
    },
    swapSelectedLayer () {
      const { base_layers: base } = this.settings
      const isBaseLayer = base.includes(this.selected)
      if (isBaseLayer) {
        pull(base, this.selected)
      } else {
        base.push(this.selected)
      }

      // update opened groups models
      // const isGroup = !!this.project.meta.layers_tree.find(i => (i.id || i.name) === this.selected)?.layers
      // if (isGroup) {
      //   const [sOpen, dOpen] = isBaseLayer ? Object.values(this.opened) : Object.values(this.opened).reverse()
      //   const opened = sOpen.filter(name => name === this.selected || this.groupsInfo[this.selected].includes(name))
      //   dOpen.push(...opened)
      //   pull(sOpen, ...opened)
      // }

      // update collapsed groups models
      const isGroup = !!this.project.meta.layers_tree.find(i => (i.id || i.name) === this.selected)?.layers
      if (isGroup) {
        const [sList, dList] = isBaseLayer ? Object.values(this.collapsed) : Object.values(this.collapsed).reverse()
        const collapsed = sList.filter(name => name === this.selected || this.groupsInfo[this.selected].includes(name))
        dList.push(...collapsed)
        pull(sList, ...collapsed)
      }
    },
    updateGroupSetting (group, settings) {
      if (!this.settings.groups) {
        this.$set(this.settings, 'groups', {})
      }
      this.$set(this.settings.groups, group.wms_name, settings)
    }
  }
}
</script>

<style lang="scss" scoped>
.layers-settings {
  display: grid;
  // grid-template-columns: 1fr auto auto 1fr;
  grid-template-columns: 1fr 1fr;
  // gap: 4px;
  column-gap: 6px;
}
// .switch {
//   grid-column: 2 / 4;
// }
// .base-layers {
//   grid-column: 1 / 3;
// }
// .overlays {
//   grid-column: 3 / 5;
// }
.switch {
  grid-column: 1 / 3;
  justify-self: center;
}
.layers-table {
  border: solid #ddd;
  border-width: 0 1px 1px 1px;
}
.label {
  text-align: center;
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 500;
  align-self: center;
  // opacity: 0.7;

  font-size: 13px;
  // background-color: #555;
  // color: #fff;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.flags {
  // min-width: 80px;
  ::v-deep .select {
    // flex-grow: 1;
    // width: 100%;
  }
}
.group-settings {
  margin-right: 24px;
}
</style>
