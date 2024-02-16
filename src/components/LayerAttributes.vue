<template>
  <div class="f-col">
    <v-dialog ref="formattersDialog" title="Formatters">
      <template v-slot="{ data }">
        <formatters-editor class="p-2" :settings="data"/>
      </template>
    </v-dialog>
    <section class="card">
      <div class="header f-row-ac px-2 dark">
        <span class="title">Attributes</span>
        <div class="f-grow"/>
        <v-select
          v-if="orderLayout"
          class="inline filled"
          color="orange"
          label="Layout"
          :items="orderLayouts"
          v-model="orderLayout"
        />
        <v-checkbox
          color="orange"
          label="Hide excluded"
          v-model="filterExcluded"
        />
        <div class="v-separator"/>
        <v-menu
          aria-label="More options"
          transition="slide-y"
          align="rr;bb,tt"
          content-class="popup-menu"
          :items="attributesMenu"
        >
          <template v-slot:activator="{ toggle }">
            <v-btn aria-label="Menu" class="icon" @click="toggle">
              <v-icon name="menu-dots"/>
            </v-btn>
          </template>
        </v-menu>
      </div>
      <v-table
        :columns="columns"
        :items="displayAttributes"
      >
        <!-- eslint-disable-next-line -->
        <template v-slot:header(visibility)="{ column }">
          <div class="f-row-ac">
            <span v-text="column.label"/>
            <v-btn
              class="icon flat"
              :color="linkedVisibility ? 'primary' : ''"
              @click="linkedVisibility = !linkedVisibility"
            >
              <v-icon name="link-chain" size="18"/>
            </v-btn>
          </div>
        </template>

        <!-- eslint-disable-next-line -->
        <template v-slot:header(export)="{ column }">
          <v-checkbox
            :label="column.label"
            :value="exportFieldsSet.size > 0"
            @input="toggleExportAttributes"
          />
        </template>

        <!-- eslint-disable-next-line -->
        <template v-slot:cell(name)="{ item }">
          <div
            class="f-col py-2"
            v-text="item.name"
            draggable="true"
            @dragstart="reorderHandlers.dragstart($event, item.name)"
            @dragover.prevent="reorderHandlers.dragover($event, item.name)"
            @drop="reorderHandlers.drop($event, item.name)"
          />
        </template>

        <!-- eslint-disable-next-line -->
        <template v-slot:cell(widget)="{ item }">
          <widget-settings
            class="widget-select"
            :attr="item"
            :attr-settings="attrsSettings[item.name]"
            @input="updateWidget(item, $event)"
          />
        </template>

        <!-- eslint-disable-next-line -->
        <template v-slot:cell(format)="{ item }">
          <v-select
            v-if="item.type === 'int' || item.type === 'float'"
            placeholder="—"
            :items="numericFormatters"
            :value="attrsSettings[item.name] && attrsSettings[item.name].format"
            @input="setFormatter(item, $event)"
          >
            <template v-slot:append="">
              <span>Add formatter</span>
            </template>
          </v-select>
        </template>

        <!-- eslint-disable-next-line -->
        <template v-slot:cell(visibility)="{ item }">
          <div class="f-row-ac">
            <v-btn
              class="icon flat"
              :color="excludedTableFields.has(item.name) ? '#aaa' : 'primary'"
              @click="toggleFieldVisibility('table', item.name)"
            >
              <v-icon name="attribute-table" size="18"/>
            </v-btn>
            <v-btn
              class="icon flat"
              :color="excludedInfopanelFields.has(item.name) ? '#aaa' : 'primary'"
              @click="toggleFieldVisibility('infopanel', item.name)"
            >
              <v-icon name="circle-i-outline" size="18"/>
            </v-btn>
          </div>
        </template>

        <!-- eslint-disable-next-line -->
        <template v-slot:cell(export)="{ item }">
          <v-checkbox
            class="f-justify-center"
            :value="exportFieldsSet.has(item.name)"
            @input="toggleAttributeExport(item.name, $event)"
          />
        </template>
      </v-table>
    </section>
    <!-- <small class="switch f-row-ac m-1">
      <v-icon name="circle-i-outline" class="m-1" size="16"/>
      <span>You can change order of attributes with Drag&Drop</span>
    </small> -->

    <section class="card f-col">
      <div class="header f-row-ac px-2 dark">
        <span class="title">Data Preview</span>
        <!-- <span class="title">Data Preview - {{ previewMode === 'table' ? 'Table' : 'Info Panel' }}</span> -->
        <v-spinner v-if="loading" class="m-2" size="18" width="2"/>
        <div class="f-grow"/>
        <v-btn
          class="flat icon"
          :color="previewMode === 'table' ? 'orange' : ''"
          @click="previewMode = 'table'">
          <v-icon name="attribute-table2"/>
        </v-btn>
        <v-btn
          class="flat icon"
          :color="previewMode === 'infopanel' ? 'orange' : ''"
          @click="previewMode = 'infopanel'"
        >
          <v-icon name="circle-i-outline"/>
        </v-btn>
      </div>

      <template v-if="previewMode === 'table'">
        <v-table
          :columns="attributeTableColumns"
          item-key="_id"
          :items="tableData"
          :loading="loading"
          :error="loadingError"
          :selected="selectedFeatureId"
          @row-click="(f, row) => selectedRow = row"
        >
          <template v-slot:header(default)="{ column }">
            <div
              :class="{drop: dragOver === column}"
              v-text="column.label"
              draggable="true"
              @dragstart="reorderHandlers.dragstart($event, column.key)"
              @dragover.prevent="reorderHandlers.dragover($event, column.key)"
              @drop="reorderHandlers.drop($event, column.key)"
            />
          </template>
          <template v-for="(slot, name) in attrTableSlots" v-slot:[`cell(${name})`]="{ item }">
            <component
              :key="name"
              :is="slot.component"
              :attribute="slot.attribute"
              :value="item[name]"
            />
          </template>
        </v-table>
        <div v-if="pagination" class="pagination f-row-ac">
          <v-btn
            class="icon"
            :disabled="pagination.page === 1"
            @click="fetchFeatures(1)"
          >
            <v-icon name="navigate_last" class="r-180"/>
          </v-btn>
          <v-btn
            class="icon"
            :disabled="pagination.page === 1"
            @click="fetchFeatures(pagination.page - 1)"
          >
            <v-icon name="navigate_arrow" class="r-180"/>
          </v-btn>
          <span v-text="paginationRangeText" class="mx-1"/>
          <v-btn
            class="icon"
            :disabled="pagination.page === lastPage"
            @click="fetchFeatures(pagination.page + 1)"
          >
            <v-icon name="navigate_arrow"/>
          </v-btn>
          <v-btn
            class="icon"
            :disabled="pagination.page === lastPage"
            @click="fetchFeatures(lastPage)"
          >
            <v-icon name="navigate_last"/>
          </v-btn>
          <div class="v-separator"/>
          <v-select
            class="inline filled"
            :label="tr.PageSize"
            :items="[5, 10, 20, 50]"
            v-model="limit"
            @input="fetchFeatures(1, true)"
          />
        </div>
      </template>

      <div v-else class="info-panel-settings">
        <div v-if="pagination" class="pagination f-row-ac">
          <v-btn
            class="icon"
            :disabled="selectedFeatureIndex < 1"
            @click="showPrevFeature"
          >
            <v-icon name="navigate_arrow" class="r-180"/>
          </v-btn>
          <span>{{ selectedFeatureIndex + 1 }} / {{ pagination.totalItems }}</span>
          <v-btn
            class="icon"
            :disabled="selectedFeatureIndex >= pagination.totalItems - 1"
            @click="showNextFeature"
          >
            <v-icon name="navigate_arrow"/>
          </v-btn>
        </div>
        <component
          v-if="selectedFeature"
          :is="infoPanelComponent"
          class="info-panel f-grow"
          :feature="selectedFeature"
          :layer="layer"
          :project="infopanelProject"
        />
        <div class="scripts f-col">
          <v-select
            label="Component"
            class="filled"
            :items="scriptsItems"
            :value="layerSettings.infopanel_component"
            @input="setInfopanelComponent"
          />
          <p class="note my-4 mx-2">
            You can completely customize appearance of layer's Info Panel by creating your own Vue.js component.
            For more information, wait for official documentation. 
          </p>
          
          <!-- <div class="f-grow"/> -->
          <v-list label="Modules" :items="scriptsList" empty-text="No script modules uploaded">
            <!-- <template v-slot:empty>
              <span>No script modules loaded</span>
            </template> -->
            <template v-slot:item="{ item }">
              <div class="f-col f-grow">
                <span class="title" v-text="item.module"/>
                <div>Components: {{ item.components.join(', ') }}</div>
                <small>File: <a target="_blank" :href="`/api/project/media/${project.name}/${item.path}`" v-text="item.path"/></small>
              </div>
              <v-btn class="icon" @click="deleteScript(item)">
                <v-icon name="delete_forever"/>
              </v-btn>
            </template>
          </v-list>
          <div class="new-script f-row">
            <!-- <v-text-field readonly class="filled" accept=".js" xtype="file" placeholder="Select File" value="name" @input="scriptSelected"/> -->
            <v-file-field
              class="filled"
              accept=".js"
              placeholder="Select File"
              :error="scriptTask.error"
              :value="loadedScript && loadedScript.file"
              @input="scriptSelected"
            >
              <!-- <v-icon slot="prepend" color="#777" name="file-js" size="24" class="mr-1"/> -->
            </v-file-field>
            <v-btn
              class="outlined round"
              xcolor="primary"
              :disabled="!loadedScript"
              @click="uploadScript"
            >
              <!-- <v-icon name="upload" class="mr-2"/> -->
              <span>Upload</span>
            </v-btn>
          </div>
        </div>

      </div>
    </section>
  </div>
</template>

<script>
import intersection from 'lodash/intersection'
import keyBy from 'lodash/keyBy'
import mapValues from 'lodash/mapValues'
import pickBy from 'lodash/pickBy'
import GeoJSON from 'ol/format/GeoJSON'

import WidgetSettings from '@/components/WidgetSettings.vue'
import FormattersEditor, { createFormatter } from '@/components/FormattersEditor.vue'
import VImage from '@/components/image/Image.vue'
import GenericInfoPanel, { DateWidget, ValueMapWidget, BoolWidget, UrlWidget, createTableImageWidget, createMediaFileTableWidget, mediaUrlFormat  } from '@/components/GenericInfopanel.vue'
import { layerFeaturesQuery } from '@/map/featureinfo'
import { excludedFieldsSet } from '@/adapters/attributes'
import { externalComponent } from '@/components-loader'
import { TaskState, watchTask } from '@/tasks'
import { pull } from '@/utils/collections'
import { isEmpty } from 'ol/extent'

export async function loadUmdScript (url, filename) {
  return new Promise((resolve, reject) => {
    const name = filename.match(/^(.*?)\.umd\.(.+\.)?js$/)?.[1]
    if (!name) {
      reject('Invalid JavaScript module, expected UMD module')
    }
    const script = document.createElement('script')
    script.async = true
    script.addEventListener('load', () => {
      resolve({
        moduleName: name,
        element: script,
        module: window[name]
      })
    })
    script.addEventListener('error', () => {
      const err = new Error(`Error loading ${url}`)
      reject(err)
    })
    script.src = url
    document.head.appendChild(script)
  })
}

function formatFeatures (features, formatters) {
  formatters = pickBy(formatters, f => f)
  features.forEach(f => {
    f._formattedProperties = mapValues(formatters, (formetter, name) => formetter.format(f.get(name)))

    Object.defineProperty(f, 'getFormatted', {
      // configurable: true,
      value: function (key) {
        return this._formattedProperties[key] ?? this.get(key)
      }
    })
  })
}

export default {
  name: 'LayerAttributes',
  components: { FormattersEditor, VImage, WidgetSettings },
  props: {
    project: Object,
    settings: Object,
    layerId: String
  },
  data () {
    return {
      orderLayout: null,
      previewMode: 'table',
      linkedVisibility: true,
      filterExcluded: false,
      features: [],
      loading: false,
      loadingError: false,
      selectedRow: 0,
      limit: 5,
      pagination: null,
      dragSource: null,
      dragOver: null,
      loadedScript: null,
      scriptTask: TaskState()
    }
  },
  computed: {
    attributesMenu () {
      let layoutOption
      if (this.orderLayout) {
        layoutOption = {
          text: 'Disable separate order layouts',
          action: () => {
            this.layerSettings.fields_order = {
              global: this.layoutAttributes.map(a => a.name)
            }
            this.orderLayout = null
          }
        }
      } else {
        layoutOption = {
          text: 'Enable separate order layouts',
          action: () => {
            const order = {
              infopanel: this.layoutAttributes.map(a => a.name),
              table: this.layoutAttributes.map(a => a.name)
            }
            this.$set(this.layerSettings, 'fields_order', order)
            this.orderLayout = 'infopanel'
          }
        }
      }
      return [
        layoutOption, {
          text: 'Reset Visibility',
          action: () => {
            this.$delete(this.layerSettings, 'excluded_fields')
          }
        }, {
          text: 'Reset Order',
          action: () => {
            this.$delete(this.layerSettings, 'fields_order')
          }
        }
      ]
    },
    orderLayouts () {
      return [
        { text: 'Info Panel', value: 'infopanel' },
        { text: 'Attributes Table', value: 'table' }
      ]
    },
    layerMeta () {
      return this.project.meta.layers[this.layerId]
    },
    layerSettings () {
      return this.settings.layers[this.layerId]
    },
    capabilities () {
      const lmeta = this.layerMeta
      const metaFlags = new Set(lmeta.flags)
      const flagsSet = new Set(this.layerSettings.flags || [])
      const layerVisible = !flagsSet.has('excluded') && !flagsSet.has('hidden')
      const isVectorLayer = lmeta.type === 'VectorLayer'

      const queryable = layerVisible && metaFlags.has('query') && flagsSet.has('query')
      return {
        identify: queryable,
        export: queryable && isVectorLayer && lmeta.options.wfs.includes('query') && flagsSet.has('export')
      }
    },
    columns () {
      return [
        {
          key: 'name',
          label: 'Name'
        }, {
          key: 'alias',
          label: 'Alias'
        }, {
          key: 'type',
          label: 'Type'
        }, {
          key: 'widget',
          label: 'Widget',
          header: { width: 1 }
        }, {
          key: 'format',
          label: 'Formatting',
          header: { width: 1 }
        }, {
          key: 'visibility',
          label: 'Visibility',
          header: { width: 1 },
          align: 'center'
        // }, {
        //   key: 'attr_table',
        //   label: 'Attribute Table',
        //   header: { width: 1 }
        //   // header: { align: 'center', width: 1 }
        // }, {
        //   key: 'info_panel',
        //   label: 'Info Panel',
        //   header: { align: 'center', width: 1 }
        }, this.capabilities.export && {
          key: 'export',
          label: 'Export',
          header: { align: 'center', width: 1 }
        }
      ].filter(c => c)
    },
    numericFormatters () {
      const defined = this.settings.formatters ?? []
      return [
        { text: '—', value: undefined },
        ...defined.map(i => ({ text: i.name, value: i.name })),
        { text: 'Actions', separator: true },
        // { text: 'Remove formatting', value: '__remove__' },
        { text: 'Manage formatters', value: '__manage__', icon: 'settings' }
      ]
    },
    attributes () {
      return this.project.meta.layers[this.layerId].attributes
    },
    defaultAttributesOrder () {
      return this.attributes.map(a => a.name)
    },
    attrsMap () {
      return keyBy(this.attributes, 'name')
    },
    layoutAttributes () {
      const fields = this.layerSettings.fields_order?.[this.orderLayout || 'global']
      if (fields) {
        return fields.map(name => this.attrsMap[name]).filter(a => a)
      }
      return this.attributes
    },
    displayAttributes () {
      if (this.filterExcluded) {
        const excluded = this.orderLayout
          ? this.orderLayout === 'table' ? this.excludedTableFields : this.excludedInfopanelFields
          : new Set([...this.excludedTableFields].filter(n => this.excludedInfopanelFields.has(n)))
        return this.layoutAttributes.filter(a => !excluded.has(a.name))
      }
      return this.layoutAttributes
    },
    attrsSettings () {
      return this.layerSettings.attributes ?? {}
    },
    finalAttributes () {
      return this.attributes.map(attr => ({
        ...attr,
        ...this.attrsSettings[attr.name]
      }))
    },
    layer () {
      const { id, name } = this.project.meta.layers[this.layerId]
      const { attributes: _, ...settings } = this.layerSettings
      const layer = {
        id,
        name,
        attributes: this.finalAttributes,
        ...settings
      }
      if (this.layerSettings.fields_order) {
        layer.info_panel_fields = this.layerSettings.fields_order.infopanel || this.layerSettings.fields_order.global
        // ? attr_table_fields
      }
      if (this.excludedInfopanelFields.size) {
        layer.info_panel_fields = layer.info_panel_fields || this.finalAttributes.map(a => a.name)
        layer.info_panel_fields = layer.info_panel_fields.filter(n => !this.excludedInfopanelFields.has(n))
      }
      return layer
    },
    selectedFeature () {
      return this.features[this.selectedRow]
    },
    selectedFeatureIndex () {
      const { pagination, selectedRow } = this
      return (pagination.page - 1) * pagination.rowsPerPage + selectedRow 
    },
    selectedFeatureId () {
      return this.selectedFeature?.getId()
    },
    infopanelProject () {
      return {
        name: this.project.name,
        ows_project: this.project.name,
        ows_url:  `/api/project/ows/${this.project.name}`,
        // formatter: name => formatters[name]
      }
    },
    projectFormatters () {
      const formatters = keyBy(this.settings.formatters, 'name')
      return mapValues(formatters, f => createFormatter(f))
    },
    layerFormatters () {
      return mapValues(
        keyBy(this.finalAttributes.filter(attr => attr.format), 'name'),
        attr => this.projectFormatters[attr.format]
      )
    },
    attrTableMap () {
      return this.attributes.reduce((data, attr) => (data[attr.name] = this.layerSettings.attr_table_fields.includes(attr.name), data), {})
    },
    infoPanelSet () {
      return new Set(this.layerSettings.info_panel_fields)
    },
    exportFieldsOrder () {
      const fieldsOrder = this.orderLayout ? this.layerSettings?.fields_order?.table : this.layerSettings?.fields_order?.global
      return fieldsOrder || this.defaultAttributesOrder
    },
    exportFieldsSet () {
      return new Set(this.layerSettings.export_fields)
    },
    excludedTableFields () {
      return excludedFieldsSet(this.layerSettings, 'table')
    },
    excludedInfopanelFields () {
      return excludedFieldsSet(this.layerSettings, 'infopanel')
    },
    infoPanelComponent () {
      const componentName = this.layerSettings.infopanel_component
      if (componentName) {
        try {
          return this.loadedScript?.components[componentName] || externalComponent(this.project, componentName)
        } catch (err) {}
      }
      return GenericInfoPanel
    },
    attributeTableColumns () {
      // old API
      // const attrsNames = this.layerSettings.attr_table_fields || []

      let fields
      if (this.layerSettings.fields_order) {
        fields = this.layerSettings.fields_order.table || this.layerSettings.fields_order.global
      }
      if (!fields) {
        fields = this.defaultAttributesOrder
      }
      const excluded = this.excludedTableFields
      const attributes = fields.filter(n => !excluded.has(n)).map(n => this.attrsMap[n]).filter(a => a)
      return attributes.map(attr => ({
        label: attr.alias || attr.name,
        type: attr.type.toLowerCase(),
        key: attr.name,
        header: {
          slot: 'default',
        },
        align: 'left',
        sortable: false
      }))
    },
    tableData () {
      // return this.features?.map(f => ({ _id: f.getId(), ...f.getProperties() }))

      const attrsNames = this.finalAttributes.map(a => a.name)
      return this.features?.map(f => ({
        _id: f.getId(),
        ...attrsNames.reduce((obj, name) => (obj[name] = f.getFormatted(name), obj), {})
        // ...f.getProperties(),
        // ...f.getFormattedProperties()
      }))
    },
    attrTableSlots () {
      const slots = {}
      this.finalAttributes.forEach(attr => {
        let widget
        if (attr.widget === 'ValueMap') {
          widget = ValueMapWidget
        } else if (attr.widget === 'Hyperlink') {
          widget = UrlWidget
        } else if (attr.widget === 'Image') {
          widget = createTableImageWidget()
        } else if (attr.widget === 'MediaFile') {
          widget = createMediaFileTableWidget(mediaUrlFormat(this.project.name, this.layer, attr))
        } else if (attr.type === 'date') { // and also attr.widget === 'DateTime' ?
          widget = DateWidget
        } else if (attr.type === 'bool') {
          widget = BoolWidget
        }
        if (widget) {
          slots[attr.name] = { component: widget, attribute: attr }
        }
      })
      return slots
    },
    lastPage () {
      const { rowsPerPage, totalItems } = this.pagination
      return Math.ceil(totalItems / rowsPerPage)
    },
    paginationRangeText () {
      const { page, rowsPerPage, totalItems } = this.pagination
      if (totalItems === 0) {
        return '-'
      }
      const sIndex = (page - 1) * rowsPerPage + 1
      const eIndex = Math.min(sIndex + rowsPerPage - 1, totalItems)
      return `${sIndex} - ${eIndex} of ${totalItems}`
    },
    tr () {
      return {
        FilterVisibleLabel: this.$gettext('Filter to visible area'),
        PageSize: this.$gettext('Page size')
      }
    },

    scriptsList () {
      const { scripts } = this.project
      if (scripts) {
        return Object.entries(scripts).map(([mod, info]) => ({ module: mod, ...info }))
      }
      return []
    },
    scriptsItems () {
      const items = [{ text: 'Generic Info Panel', value: undefined }]
      const { scripts } = this.project
      if (scripts) {
        Object.entries(scripts).forEach(([mod, info]) => {
          items.push({ text: mod, separator: true })
          items.push(...info.components.map(n => ({ text: n, value: n })))
        })
      }
      if (this.loadedScript) {
        items.push({ text: 'Loaded script', separator: true })
        items.push(...this.loadedScript.componentsNames.map(n => ({ text: n, value: n })))
      }
      return items
    },
    reorderHandlers () {
      let dragSrc
      return {
        dragstart: (e, attr) => {
          dragSrc = attr
          e.dataTransfer.effectAllowed = 'move'
        },
        dragover: (e, attr) => {
          e.dataTransfer.dropEffect = dragSrc !== attr ? 'move' : 'none'
        },
        drop: (e, attr) => {
          if (!this.orderLayout && !this.layerSettings.fields_order?.global) {
            this.$set(this.layerSettings, 'fields_order', { global: this.defaultAttributesOrder })
          }
          const layout = this.layerSettings.fields_order[this.orderLayout || 'global']
          const sIndex = layout.indexOf(dragSrc)
          const dIndex = layout.indexOf(attr)
          layout.splice(sIndex, 1)
          layout.splice(dIndex, 0, dragSrc)
        }
      }
    }
  },
  created () {
    this.initStateFromSettings(this.layerSettings)
    this.fetchFeatures()
  },
  watch: {
    layerFormatters () {
      if (this.features) {
        const features = this.features.map(f => f.clone())
        formatFeatures(features, this.layerFormatters)
        this.features = Object.freeze(features)
      }
    },
    exportFieldsOrder (fields) {
      this.layerSettings.export_fields = fields.filter(n => this.exportFieldsSet.has(n))
    }
  },
  methods: {
    initStateFromSettings (ls) {
      if (ls.excluded_fields) {
        const { infopanel, table } = ls.excluded_fields
        this.linkedVisibility = !infopanel?.length && !table?.length
      }
      this.orderLayout = ls.fields_order?.infopanel ? 'infopanel' : null
    },
    async fetchFeatures (page = 1) {
      const mapProjection = this.project.meta.projection.code
      // fetch only attributes, without geometry
      const query = layerFeaturesQuery(this.layer, null, null, this.defaultAttributesOrder)

      const baseParams = {
        VERSION: '1.1.0',
        SERVICE: 'WFS',
        REQUEST: 'GetFeature',
        OUTPUTFORMAT: 'GeoJSON'
      }

      const url = `/api/project/ows/${this.project.name}`
      const headers = { 'Content-Type': 'text/xml' }
      let geojson, featuresCount
      this.loading = true
      this.loadingError = false
      // await new Promise(resolve => setTimeout(resolve, 2000))
      try {
        let params = { ...baseParams, resultType: 'hits' }
        let resp = await this.$http.post(url, query, { params, headers })
        // fix invalid geojson from QGIS server (missing ',')
        try {
          featuresCount = JSON.parse(resp.data.replace(/"\n/g, '",\n')).numberOfFeatures
        } catch (err) {
          featuresCount = resp.data.numberOfFeatures
        }

        params = {
          ...baseParams,
          STARTINDEX: (page - 1) * this.limit,
          MAXFEATURES: this.limit
        }
        resp = await this.$http.post(url, query, { params, headers })
        geojson = resp.data
      } catch (e) {
        console.error(e)
        this.loadingError = 'Failed to load data'
        return
      } finally {
        this.loading = false
      }
      const parser = new GeoJSON()

      // const features = ShallowArray(parser.readFeatures(geojson, { featureProjection: mapProjection }))
      const features = Object.freeze(parser.readFeatures(geojson, { featureProjection: mapProjection }))
      formatFeatures(features, this.layerFormatters)
      this.features = features
      this.pagination = {
        query,
        page,
        rowsPerPage: this.limit,
        totalItems: featuresCount
      }
      this.selectedRow = 0
    },
    async showPrevFeature () {
      this.selectedRow -= 1
      if (this.selectedRow < 0) {
        await this.fetchFeatures(this.pagination.page - 1)
        this.selectedRow = this.features.length - 1
      }
    },
    showNextFeature () {
      if (this.selectedRow + 1 >= this.pagination.rowsPerPage) {
        this.fetchFeatures(this.pagination.page + 1)
      } else {
        this.selectedRow += 1
      }
    },
    toggleAttributeExport (name, val) {
      const filter = val
        ? n => this.exportFieldsSet.has(n) || n === name
        : n => this.exportFieldsSet.has(n) && n !== name
      this.$set(this.layerSettings, 'export_fields', this.exportFieldsOrder.filter(filter))
    },
    toggleExportAttributes () {
      const newValue = this.exportFieldsSet.size > 0 ? [] : this.exportFieldsOrder
      this.$set(this.layerSettings, 'export_fields', newValue)
    },
    toggleFieldVisibility (model, name) {
      const isExcluded = this[model === 'table' ? 'excludedTableFields' : 'excludedInfopanelFields'].has(name)
      const excluded = this.layerSettings.excluded_fields ?? {}
      let { global = [], table = [], infopanel = [] } = pickBy(excluded)
      // 'extract' globally excluded fields
      let newExcluded = {
        infopanel: infopanel.concat(global),
        table: table.concat(global)
      }
      if (isExcluded) {
        if (this.linkedVisibility) {
          Object.values(newExcluded).forEach(model => pull(model, name))
        } else {
          pull(newExcluded[model], name)
        }
      } else {
        if (this.linkedVisibility) {
          Object.values(newExcluded).forEach(model => model.push(name))
        } else {
          newExcluded[model].push(name)
        }
      }
      // compute new globally excluded fields
      const mutual = intersection(newExcluded.infopanel, newExcluded.table)
      newExcluded.global = mutual
      if (mutual.length) {
        newExcluded.infopanel = newExcluded.infopanel.filter(n => !mutual.includes(n))
        newExcluded.table = newExcluded.table.filter(n => !mutual.includes(n))
      }
      newExcluded = pickBy(newExcluded, v => v.length)
      const empty = !Object.keys(newExcluded).length // seems like lodash's isEmpty not working here on reactive data
      // console.log('empty', empty, 'lodash', isEmpty(newExcluded))
      if (empty) {
        this.$delete(this.layerSettings, 'excluded_fields')
      } else {
        this.$set(this.layerSettings, 'excluded_fields', newExcluded)
      }
    },
    setAttributeSetting (attr, key, value) {
      if (!this.layerSettings.attributes) {
        this.$set(this.layerSettings, 'attributes', {})
      }
      if (!this.attrsSettings[attr.name]) {
        this.$set(this.attrsSettings, attr.name, { [key]: value })
      } else {
        this.$set(this.attrsSettings[attr.name], key, value)
      }
    },
    setFormatter (attr, value) {
      if (value === '__manage__') {
        this.$refs.formattersDialog.show(this.settings)
      } else {
        this.setAttributeSetting(attr, 'format', value)
      }
    },
    updateWidget (attr, data) {
      this.setAttributeSetting(attr, 'widget', data.widget)
    },
    setInfopanelComponent (item) {
      this.$set(this.layerSettings, 'infopanel_component', item)
      // this.$set(this.layerSettings, 'infopanel_component', item.value)
    },
    scriptSelected (file) {
      if (this.script) {
        URL.revokeObjectURL(this.script.element.src)
        this.script.element.remove()
        this.script = null
      }
      if (file) {
        const t = this.loadScript(file)
        watchTask(t, this.scriptTask)
      } else {
        this.loadedScript = null
        this.scriptTask = TaskState()
      }
    },
    async loadScript (f) {
      const objectURL = URL.createObjectURL(f)
      const script = await loadUmdScript(objectURL, f.name)
      let components = script.module.__esModule ? script.module.default : [script.module]
      components = components.filter(c => c.name)
      if (!script.moduleName || components.length < 1) {
        throw new Error('Invalid script module')
      }
      this.script = script
      this.loadedScript = Object.freeze({
        file: f,
        moduleName: script.moduleName,
        components: keyBy(components, 'name'),
        componentsNames: components.map(c => c.name)
      })
    },
    async uploadScript () {
      const { file, moduleName, componentsNames: components } = this.loadedScript
      const form = new FormData()
      const info = { module: moduleName, path: file.name, components }
      form.append('info', JSON.stringify(info))
      form.append('script', file, file.name)
      const t = this.$http.post(`/api/project/script/${this.project.name}`, form)
      const { data: scripts } = await watchTask(t, this.scriptTask, { errorHandler: err => err.response?.data?.message || 'Failed to upload file' })
      if (this.scriptTask.success) {
        this.project.scripts = scripts
        this.loadedScript = null
      }
      // try {
      //   const { data: scripts } = this.$http.post(`/api/project/script/${this.project.name}`, form)
      //   this.project.scripts = scripts
      //   this.loadedScript = null
      //   this.uploadError = null
      // } catch (err) {
      //   this.uploadError = 'Failed to upload file'
      // }
    },
    async deleteScript (item) {
      const { data: scripts } = await this.$http.delete(`/api/project/script/${this.project.name}`, { data: [item.module] })
      this.project.scripts = scripts
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/card.scss';

.header {
  ::v-deep .input {
    height: 28px;
  }
}
// data grid table
.table-container {
  border: 1px solid var(--border-color);
  .select {
    min-width: 150px;
    margin: 3px 0;
    ::v-deep .input {
      height: 30px;
    }
    &.widget-select {
      width: 180px;
    }
  }
}
.table-container {
  ::v-deep {
    table {
      border-bottom: 1px solid #ddd;
    }
    thead {
      th[role="columnheader"] {
        height: 40px;
      }
      tr.progress th {
        top: 40px!important;
      }
    }
    td {
      white-space: nowrap;
      max-width: 600px; // TODO: multiple sizes dependent by columns count
      text-overflow: ellipsis;
      overflow: hidden;
      a {
        color: var(--color-primary);
        text-decoration: none;
      }
    }
  }
}
.info-panel-settings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  .info-panel {
    // grid-area: 2 / 1 / 3 / 2;
    grid-area: 1 / 1 / 2 / 2;
  }
  .scripts {
    // grid-area: 2 / 2 / 3 / 3;
    grid-area: 1 / 2 / 3 / 3;
    .btn {
      height: 32px;
    }
  }
  .pagination {
    grid-area: 2 / 1 / 3 / 2;
    margin: 0 6px 3px 6px;
    // margin-right: 6px;
    // border-top: 1px solid #ddd;
    background-color: #fff;
    align-self: end;
  }
}
.scripts {
  ::v-deep .item {
    display: grid;
    grid-template-columns: 1fr auto;
  }
  .title {
    font-size: 18px;
    font-weight: 500;
  }
  a {
    color: var(--color-primary);
  }
}
.formatters {
  min-width: 400px;
  max-width: calc(100vw - 24px);
  width: 700px;
  // width: clamp(100px, 600px, 90vw);
}
.pagination {
  // align-self: center;
  // justify-self: center;
  font-size: 14px;
  line-height: normal;
  background-color: #fafafa;
  justify-content: center;

  .btn {
    max-height: 28px;
    &.icon {
      width: 24px;
      height: 24px;
      margin: 2px;
    }
  }
  .i-field ::v-deep .input {
    height: 24px;
  }
}
.note {
  font-size: 14px;
  opacity: 0.7;
}
</style>
