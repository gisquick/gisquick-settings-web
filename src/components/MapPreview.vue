<template>
  <div class="f-row" style="height: 300px">
    <map-view
      ref="map"
      class="m-2 f-grow"
      :project="project.name"
      :layers="visibleLayers"
      :config="project.meta"
      :settings="settings"
      :rotation="rotation"
    >
      <template v-slot:toolbar>
        <v-btn class="layers-toggle icon flat" @click="zoomToExtent(extent)">
          <v-icon size="24" name="zoom-to" />
        </v-btn>
      </template>

      <draw-extent color="#EB5757" :edit="false" :value="extent" />
    </map-view>
  </div>
</template>

<script>
import Page from '@/mixins/Page'
import {
  layersList,
  layersGroups,
  transformLayersTree,
  filterLayers,
} from '@/utils/layers'
import { extentPrecision } from '@/utils/units'

export default {
  name: 'ProjectMap',
  components: {
    MapView: async () => (await import('@/components/map-components')).Map,
    DrawExtent: async () =>
      (await import('@/components/map-components')).DrawExtent,
  },
  mixins: [Page],
  props: {
    project: Object,
    settings: Object,
    extent: Object,
    rotation: Number,
  },
  data() {
    return {
      layers: [],
    }
  },
  computed: {
    groups() {
      return layersGroups(this.project.meta.layers_tree)
    },
    flatLayers() {
      const layersOrder = this.project.meta.layers_order.reduce(
        (res, id, i) => ((res[id] = i), res),
        {},
      )
      return layersList(this.layers).sort(
        (a, b) => (layersOrder[b.id] ?? 0) - (layersOrder[a.id] ?? 0),
      )
    },
    hiddenLayers() {
      const hiddenGroups = layersGroups(this.layers).filter((g) => !g.visible)
      return new Set(
        []
          .concat(...hiddenGroups.map((g) => layersList(g.layers)))
          .map((l) => l.id),
      )
    },
    visibleLayers() {
      return this.flatLayers
        .filter((l) => l.visible && !this.hiddenLayers.has(l.id))
        .map((l) => l.name)
    },
    extentPrecision() {
      return extentPrecision(this.project.meta.units.map, 3)
    },
  },
  created() {
    this.initLayersModel(this.project.meta)
  },
  methods: {
    initLayersModel(meta) {
      const layers = transformLayersTree(
        meta.layers_tree,
        (l) => ({ ...meta.layers[l.id] }),
        (g, layers) => ({
          ...g,
          id: g.name,
          layers,
          visible: true,
          expanded: true,
        }),
      )
      this.layers = filterLayers(layers, (l) =>
        meta.layers_order.includes(l.id),
      )
    },
    zoomToExtent(extent) {
      const olMap = this.$refs.map.map
      olMap.getView().fit(extent, { padding: [50, 50, 50, 50] })
    },
  },
}
</script>
