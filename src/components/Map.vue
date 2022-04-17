<template>
  <div class="map">
    <div class="toolbar f-row-ac">
      <map-controls class="f-row" @reset-zoom="resetZoom"/>
      <slot name="toolbar"/>
      <div class="f-grow"/>
      <transition name="fade">
        <div v-if="loading" class="progressbar f-row-ac p-2">
          <span class="mr-2">Loading</span>
          <v-spinner size="18" width="2"/>
        </div>
      </transition>
      <slot name="toolbar-end"/>
    </div>

    <div ref="map" class="f-grow"/>
    <div v-if="error" class="error">
      Failed to render map
    </div>
    <slot/>
  </div>
</template>

<script>
import Map from 'ol/Map'
import View from 'ol/View'
import ImageLayer from 'ol/layer/Image'
import ImageWMS from 'ol/source/ImageWMS'
import { getCenter } from 'ol/extent'
import { get as getProj } from 'ol/proj'
import { register } from 'ol/proj/proj4'
import { defaults as defaultInteractions } from 'ol/interaction'
import { defaults as defaultControls } from 'ol/control'
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom'
import proj4 from 'proj4'

import 'ol/ol.css'

import MapControls from '@/components/MapControls.vue'
// import { layersList } from '@/utils/layers'


export default {
  components: { MapControls },
  props: {
    project: String,
    config: Object,
    layers: Array,
    settings: Object
  },
  data () {
    return {
      error: false,
      loading: false
    }
  },
  computed: {
    extent () {
      return this.settings?.extent || this.config.extent
    },
    zoomExtent () {
      return this.settings?.zoom_extent
    },
    layersParam () {
      return this.layers.join(',')
    }
  },
  created () {
    this.createMap()
  },
  mounted () {
    this.map.setTarget(this.$refs.map)
    this.map.getView().fit(this.extent, { padding: [50, 50, 50, 50] })
  },
  activated () {
    if (!this.map.getSize()) {
      this.map.updateSize()
      this.map.getView().fit(this.extent, { padding: [50, 50, 50, 50] })
    }
  },
  beforeDestroy () {
    if (this.map) {
      this.map.dispose()
    }
  },
  watch: {
    project () {
      if (this.map) {
        this.map.dispose()
      }
      this.createMap()
      if (this.$refs.map) {
        this.map.setTarget(this.$refs.map)
      }
    },
    layersParam (value) {
      this.wmsSource.updateParams({ LAYERS: value })
    }
  },
  methods: {
    createMap () {
      const { config, settings } = this

      const layers = Object.values(config.layers).filter(l => l.visible)
      layers.sort((a, b) => (b.drawing_order || 0) - (a.drawing_order || 0))

      Object.entries(config.projections).forEach(([code, def]) => {
        if (code && !getProj(code)) {
          proj4.defs(code, def.proj4)
        }
      })
      register(proj4)

      const source = new ImageWMS({
        // url: '/api/project/map',
        url: `/api/project/map/${this.project}`,
        params: {
          // MAP: this.project,
          LAYERS: this.layersParam,
          FORMAT: 'image/png',
          TRANSPARENT: 'false'
        },
        serverType: 'qgis',
        ratio: 1.0
      })
      const mapLayer = new ImageLayer({ source })
      this.wmsSource = source
      source.on('imageloadstart', () => {
        this.loading = true
      })
      source.on('imageloadend', () => {
        this.error = false
        this.loading = false
      })
      source.on('imageloaderror', () => {
        this.error = true
        this.loading = false
      })
      // const zoomInteraction = new MouseWheelZoom({
      //   condition: evt => evt.type === 'wheel' && evt.originalEvent.ctrlKey
      // })
      this.map = new Map({
        layers: [mapLayer],
        view: new View({
          projection: getProj(config.projection),
          center: getCenter(this.extent),
          zoom: 0,
          // resolutions: config.tile_resolutions,
        }),
        controls: defaultControls({
          zoom: false,
          rotate: false
        })
        // interactions: defaultInteractions({mouseWheelZoom: false}).extend([zoomInteraction])
      })
      // if (process.env.NODE_ENV === 'development') {
      //   window.olmap = this.map
      // }
    },
    getImage () {
      return this.wmsSource.image_.getImage()
    },
    resetZoom () {
      // this.map.getView().setCenter(getCenter(this.config.extent))
      this.map.getView().fit(this.config.extent, { padding: [50, 50, 50, 50] })
    }
  }
}
</script>

<style lang="scss" scoped>
.map {
  position: relative;
  background-color: #fff;
  display: flex;
  flex-direction: column;

  .progressbar {
    font-size: 14px;
  }
  .error {
    position: absolute;
    top: 45%;
    text-align: center;
    width: 100%;
    z-index: 100;
    color: var(--color-red);
    font-size: 15px;
    font-weight: 500;
  }
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: grid;
  }
  .map-controls {
    margin: 3px;
    // border: 1px solid #ddd;
    // padding: 2px;
  }
  .toolbar {
    background-color: #eee;
    // background-color: #f3f3f3;
    border-bottom: 1px solid #ddd;
    padding: 2px;
  }
}
</style>