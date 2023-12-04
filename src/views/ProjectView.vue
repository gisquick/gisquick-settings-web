<template>
  <div style="display: contents;">
    <v-dialog :value="!!showErrors" @closed="showErrors = false">
      <div v-if="projectErrors" class="error-dialog f-col">
        <div class="toolbar dark f-row-ac px-2">
          <span class="title">Errors</span>
          <div class="f-grow"/>
          <v-btn class="icon" @click="showErrors = false">
            <v-icon name="x"/>
          </v-btn>
        </div>
        <div class="errors p-2">
          <p class="my-2">Project settings contains errors. Please fix all errors in order to update project.</p>
          <ul>
            <li v-for="(err, i) in projectErrors" :key="i">
              <span v-text="err"/>
            </li>
          </ul>
        </div>
      </div>
    </v-dialog>

    <v-dialog :value="!!jsonDialog" @closed="jsonDialog = null">
      <div v-if="jsonDialogData" class="json-dialog f-col">
        <div class="toolbar dark f-row-ac px-2">
          <span class="title" v-text="jsonDialogData.title"/>
          <div class="f-grow"/>
          <v-checkbox label="Content filter" v-model="jsonRouteFilter"/>
          <v-btn class="icon" @click="jsonDialog = null">
            <v-icon name="x"/>
          </v-btn>
        </div>
        <json-viewer2 :data="jsonDialogData.json"/>
        <!-- <json-pretty v-if="project" :data="project.meta"/> -->
      </div>
    </v-dialog>
    <!-- <v-dialog ref="metaDialog">
      <template v-slot="{ close, data }">
        <div class="json-dialog f-col">
          <div class="toolbar f-row-ac">
            <v-checkbox label="Page filter" v-model="jsonRouteFilter"/>
            <div class="f-grow"/>
            <v-btn class="icon" @click="close"><v-icon name="x"/></v-btn>
          </div>
          <json-viewer2 v-if="data" :data="data.json"/>
        </div>
      </template>
    </v-dialog> -->

    <!-- <v-dialog ref="confirmDeleteDialog">
      <template v-slot="{ close }">
        <div class="f-row-ac p-2">
          <v-icon name="unknown"/>
          <span class="mx-2">Are you sure to delete this project?</span>
          <v-btn color="grey" @click="close">No</v-btn>
          <v-btn color="primary" @click="deleteProject">Yes</v-btn>
        </div>
      </template>
    </v-dialog> -->
    <confirm-dialog
      ref="confirmDeleteDialog"
      :action="deleteProject"
      icon="warning"
      text="Are you sure to delete this project?"
    />
    <v-dialog ref="projectionDialog" title="Projection">
      <projections-settings :meta="project.meta" :settings="settings"/>
    </v-dialog>
    <div v-if="project && settings" class="project-page f-col light">
      <portal to="menu">
        <nav class="menubar2 dark f-grow f-row-ac my-2">
        <!-- <nav class="menubar f-row-ac mb-2 px-2"> -->
          <router-link class="general m-2" :to="{name: 'project'}">General</router-link>
          <router-link class="m-2" :to="{name: 'files'}">Files</router-link>
          <router-link class="m-2" :to="{name: 'map'}">Map</router-link>
          <router-link class="m-2" :to="{name: 'layers'}">Layers</router-link>
          <router-link class="m-2" :to="{name: 'topics'}">Topics</router-link>
          <router-link class="m-2" :to="{name: 'access'}">Permissions</router-link>
          <router-link class="m-2" :to="{name: 'bookmarks'}" v-if="projectHasBookmarks">Bookmarks</router-link>
          <div class="v-separator"/>

          <!-- <v-btn v-if="project.settings" class="small" :to="{name: 'update'}"> -->
          <v-btn class="small" :to="{name: 'update'}">
            <v-icon name="qgis" class="mr-2"/>
            <span>Update</span>
          </v-btn>
          <div class="f-grow"/>
          <v-btn to="/" class="icon general">
            <v-icon name="upward_arrow"/>
          </v-btn>
          <v-btn
            v-if="project.state === 'published'"
            :href="`/?PROJECT=${project.name}`"
            class="small"
          >
            <v-icon name="map" class="mr-2"/>
            <span>Map</span>
          </v-btn>
          <v-btn
            class="small"
            :disabled="!settingsChanged || projectErrors.length > 0"
            @click="saveSettings"
          >
            <v-icon name="save" class="mr-2"/>
            <!-- <span v-if="refSettings">Save</span> -->
            <span v-if="project.settings">Save</span>
            <span v-else>Publish</span>
          </v-btn>
          <v-btn v-if="projectErrors.length" class="icon" @click="showErrors = true">
            <v-icon name="warning" color="red"/>
          </v-btn>
          <!-- <v-icon v-if="projectErrors.length" name="warning" color="red"/> -->
          <v-menu
            aria-label="Project actions"
            transition="slide-y"
            align="rr;bb,tt"
            content-class="popup-menu"
            :items="projectMenu"
          >
            <template v-slot:activator="{ toggle }">
              <v-btn aria-label="Menu" class="icon" @click="toggle">
                <v-icon name="menu-dots"/>
              </v-btn>
            </template>
          </v-menu>
        </nav>
      </portal>

      <div v-if="$route.name === 'project'" class="f-col page-content">

        <!-- Header -->
        <div class="header dark">
          <div class="thumbnail light f-col-ac">
            <img v-if="project.thumbnail" :src="`/api/project/thumbnail/${project.name}`"/>
            <!-- <img v-else src="@/assets/map.svg"/> -->
            <template v-else>
              <map-img width="150"/>
              <small class="uppercase">No Thumbnail</small>
            </template>
            <!-- <map-img v-else width="100%"/> -->
          </div>
          <div class="text f-col px-2">
            <v-text-field
              color="yellow"
              class="title m-0"
              placeholder="No Title"
              v-model="settings.title"
              lazy
            >
              <template v-if="!settings.title" v-slot:prepend>
                <v-icon name="warning" color="orange" class="mr-2"/>
              </template>
              <template v-slot:append>
                <v-icon class="edit ml-2" name="pencil"/>
              </template>
            </v-text-field>
            <span v-text="project.name" class="name"/>
          </div>
          <div class="details f-row f-align-end">
            <v-badge color="dark" glow>
              <span v-text="project.meta.projection"/>
              <v-icon
                role="button"
                name="arrow-down"
                size="12"
                class="ml-1"
                @click="$refs.projectionDialog.show()"
              />
            </v-badge>
            <div class="f-row-ac m-2">
              <v-icon name="storage" size="16" class="m-1"/>
              <span v-text="$format.filesize(project.size)"/>
            </div>
          </div>
          <v-badge class="auth uppercase" :color="statusColorMap[project.state]">
            <span v-text="project.state"/>
            <v-icon v-if="project.authentication" :name="authIcons[project.authentication]" xsize="16"/>
          </v-badge>
          <div class="time-info f-col">
            <div><strong>Created:</strong> <span :title="createdAt.datetime" v-text="createdAt.date"/></div>
            <div><strong>Updated:</strong> <span :title="updatedAt.datetime" v-text="updatedAt.date"/></div>
          </div>
        </div>

        <qgis-layers-info :meta="project.meta"/>
      </div>

      <keep-alive>
        <router-view
          v-if="project"
          :project="project"
          :settings="settings"
        />
      </keep-alive>
    </div>
    <div v-else-if="fetchTask.pending" class="f-col-ac m-4">
      <v-spinner/>
    </div>
    <div v-else-if="fetchTask.error" class="f-col-ac">
      <p>
        Error: {{ fetchTask.error.message }} / {{ fetchTask.error.status }}
      </p>
      <v-btn @click="deleteProject">
        <v-icon name="delete_forever"/>
        <span class="ml-2">Delete Project</span>
      </v-btn>
    </div>

    <portal-target name="left-panel" class="left-panel f-col"/>
    <portal-target name="right-panel" class="right-panel f-col"/>
    <!-- <div class="right-panel f-col">
    </div> -->
  </div>
</template>

<script>
// import JsonPretty from 'vue-json-pretty'
// import 'vue-json-pretty/lib/styles.css'
import mapValues from 'lodash/mapValues'
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import combineURLs from 'axios/lib/helpers/combineURLs'

import ConfirmDialog from '@/components/ConfirmDialog.vue'
import QgisLayersInfo from '@/components/QgisLayersInfo.vue'
import JsonViewer from '@/components/JsonViewer.vue'
// import JsonViewer2 from '@/components/JsonViewer2.vue'
import JsonViewer2 from '@/components/JsonDiffViewer.vue'
import ProjectionsSettings from '@/components/ProjectionsSettings.vue'
import { scalesToResolutions, ProjectionsScales } from '@/utils/scales'
import { TaskState, watchTask } from '@/tasks'
import { objectDiff } from '@/utils/diff'
import { hasAny, pull } from '@/utils/collections'

import MapImg from '@/assets/map.svg?component'

function validatedSettings (settings, meta) {
  // detection of media folders
  // const s = new Set()
  // Object.entries(settings.layers).filter(([lid, lset]) => lset.attributes).forEach(([lid, lset]) => {
  //   Object.values(lset.attributes).filter(a => a.widget === 'MediaImage').forEach(a => {
  //     const mediaFolder = a.config?.directory || `web/${meta.layers[lid].name}`
  //     s.add(mediaFolder)
  //   })
  // })

  settings.auth.roles?.forEach(role => {
    const attrsPerms = role.permissions.attributes
    Object.entries(attrsPerms).forEach(([layerId, perms]) => {
      if (!perms.geometry) {
        const layerPerms = role.permissions.layers[layerId]
        const layerEditable = layerPerms.includes('query') && hasAny(layerPerms, 'update', 'insert', 'delete')
        perms.geometry = layerEditable ? ['edit'] : []
      }
    })
  })

  Object.entries(settings.layers).filter(([_, lset]) => lset.export_fields).forEach(([lid, lset]) => {
    const attrs = meta.layers[lid]?.attributes?.map(a => a.name)
    pull(lset.export_fields, ...lset.export_fields.filter(name => !attrs.includes(name)))
  })

  // fix fields_order layer settings
  Object.entries(settings.layers).filter(([_, lset]) => lset.fields_order).forEach(([lid, lset]) => {
    const attrs = meta.layers[lid]?.attributes?.map(a => a.name)
    for (const [k, v] of Object.entries(lset.fields_order)) {
      // remove non existing fields
      pull(v, ...v.filter(name => !attrs.includes(name)))
      // add missing fields
      attrs.filter(name => !v.includes(name)).forEach(name => v.push(name))
    }
  })

  // convert old MediaImage widget to the bew MediaFile
  Object.entries(settings.layers).filter(([_, lset]) => lset.attributes).forEach(([_, lset]) => {
    Object.values(lset.attributes).filter(a => a.widget === 'MediaImage').forEach(a => {
      a.widget = 'MediaFile'
      a.config = {...a.config, accept: ['image/*'] }
    })
  })

  // initialize missing layers settings
  Object.keys(meta.layers).filter(lid => !settings.layers[lid]).forEach(lid => {
    settings.layers[lid] = { flags: [...meta.layers[lid].flags] }
  })
  // temporary
  settings.topics?.filter(t => !t.id).forEach(t => {
    t.id = t.title.toLowerCase().replace(/ /, '_')
  })
  return settings
}

export default {
  name: 'ProjectView',
  components: { ConfirmDialog, QgisLayersInfo, MapImg, JsonViewer, JsonViewer2, ProjectionsSettings },
  // components: { QgisLayersInfo, MapImg, JsonPretty, JsonViewer, JsonViewer2 },
  props: {
    user: String,
    name: String,
    publishedProject: Object // when redirected from Publish View
  },
  data () {
    return {
      fetchTask: TaskState(),
      settings: null,
      jsonRouteFilter: false,
      jsonDialog: null,
      editTitle: false,
      project: null,
      showErrors: false
    }
  },
  computed: {
    createdAt () {
      return this.formatDate(this.project?.created)
    },
    updatedAt () {
      return this.formatDate(this.project?.last_update)
    },
    projectName () {
      return `${this.user}/${this.name}`
    },
    projectData () {
      return this.publishedProject || this.fetchTask.data
    },
    statusColorMap () {
      return {
        empty: 'grey',
        staged: 'orange',
        published: 'green'
      }
    },
    authIcons () {
      return {
        private: 'lock',
        public: 'globe',
        users: 'users'
      }
    },
    settingsChanged () {
      return this.project && !isEqual(this.project.settings, this.settings)
    },
    projectMenu () {
      return [
        { text: 'Download Project', icon: 'download', link: `/api/project/download/${this.project.name}` },
        { text: 'WMS Service', icon: 'copy', action: this.copyWmsServiceUrl },
        { text: 'Reset Settings', icon: 'reload', action: this.resetSettings },
        { text: 'Delete Project', icon: 'delete_forever', action: () => this.$refs.confirmDeleteDialog.show() },
        { text: 'Debug', separator: true },
        { text: 'QGIS Meta', action: () => this.jsonDialog = 'meta' },
        { text: 'Settings', action: () => this.jsonDialog = 'settings' },
        { text: 'Unsaved changes', action: () => this.jsonDialog = 'settings_diff', disabled: !this.settingsChanged }
      ]
    },
    projectErrors () {
      const errors = []
      if (this.settings) {
        if (!this.settings.title) {
          errors.push('Project title is not defined')
        }
        if (!this.settings.scales?.length > 0) {
          errors.push('Map scales are not defined')
        }
      }
      return errors // errors.length ? errors : null
    },
    jsonDialogData () {
      let data
      if (this.jsonDialog === 'meta') {
        data = { title: 'QGIS Meta', json: this.project.meta }
      } else if (this.jsonDialog === 'settings') {
        data =  { title: 'Gisquick Settings', json: this.settings }
      } else if (this.jsonDialog === 'settings_diff') {
        const json = objectDiff(this.settings, this.project.settings)
        data = { title: 'Gisquick Settings', json }
      }
      if (data && this.jsonRouteFilter) {
        const { name, params } = this.$route
        if (name === 'layers') {
          data.json = data.json.layers
        } else if (name === 'attributes' || name === 'layer-settings') {
          data.json = data.json.layers[params.layerId]
        } else if (name === 'topics') {
          data.json = data.json.topics
        }
      }
      return data
    },
    projectHasBookmarks() {
      return (
        this.project.meta.bookmarks &&
        Object.keys(this.project.meta.bookmarks).length > 0
      )
    },
    // layersProjectCapabilities () {
    //   console.log('# layersProjectCapabilities')
    //   return this.settings && mapValues(this.project.meta.layers, l => this.settings.layers[l.id].flags)
    // },
  },
  // watch: {
  //   projectName: {
  //     immediate: true,
  //     handler: 'fetchProjectInfo'
  //   }
  // },
  watch: {
    projectData: {
      immediate: true,
      handler (data) {
        this.project = {
          ...data,
          files: this.createFilesTask()
        }
      }
    }
  },
  created () {
    if (this.publishedProject) {
      this.settings = this.newSettings(this.publishedProject.meta)
    } else {
      this.fetchProjectInfo()
    }
  },
  provide () {
    return {
      fetchProjectInfo: this.fetchProjectInfo
    }
  },
  methods: {
    createFilesTask () {
      const state = TaskState()
      state.fetch = () => {
        const task = this.$http.get(`/api/project/files/${this.project.name}`)
        watchTask(task, state)
      }
      state.invalidate = () => {
        state.success = false
        state.data = null
      }
      return state
    },
    newSettings (meta) {
      const layers = mapValues(meta.layers, (l) => ({
        // flags: [l.queryable ? 'query' : null].filter(f => !!f),
        flags: [...l.flags],
        // how about attr_table_fields/info_panel_fields?
        // attributes: {}
      }))
      const settings = {
        auth: {
          type: 'private',
          roles: null,
          users: null
        },
        base_layers: meta.base_layers?.filter(id => meta.layers_tree.some(item => item.id === id)) ?? [],
        extent: meta.extent,
        layers,
        title: meta.title,
        topics: [],
        use_mapcache: false
      }
      if (meta.scales.length) {
        Object.assign(settings, {
          scales: meta.scales,
          tile_resolutions: scalesToResolutions(meta.scales, meta.units)
        })
      } else {
        const projInfo = ProjectionsScales[meta.projection]
        if (projInfo) {
          Object.assign(settings, projInfo)
        }
      }
      return settings
    },
    async fetchProjectInfo () {
      const task = this.$http.get(`/api/project/full-info/${this.projectName}`)
      // watchTask(task, this.fetchTask).then(({ data }) => {
      //     this.fetchedProject = data
      //     const { meta, settings } = data
      //     this.settings = settings ? cloneDeep(settings) : this.newSettings(meta)
      //   })

      const { data } = await watchTask(task, this.fetchTask)
      if (this.fetchTask.success) {
        const { meta, settings } = data
        // this.settings = settings ? cloneDeep(validatedSettings(settings, meta)) : this.newSettings(meta)
        // this.refSettings = cloneDeep(this.settings)
        if (settings) {
          this.refSettings = settings
          this.settings = validatedSettings(cloneDeep(settings), meta)
        } else {
          this.refSettings = this.newSettings(meta)
          this.settings = cloneDeep(this.refSettings)
        }
      }
    },
    async saveSettings () {
      try {
        await this.$http.post(`/api/project/settings/${this.projectName}`, this.settings)
      } catch (err) {
        console.error(err)
        this.$notify.error('Failed to save')
        return
      }
      this.$notify.success('Project settings was updated')
      this.fetchProjectInfo()
    },
    resetSettings () {
      // this.settings = this.newSettings(this.qgisMeta)
      this.settings = this.newSettings(this.project.meta)
    },
    async deleteProject () {
      try {
        await this.$http.delete(`/api/project/${this.projectName}`)
        this.$router.push('/')
      } catch (err) {
        this.$notify.error('Failed to delete project')
      }
    },
    formatDate (d) {
      return {
        date: this.$format.date(d),
        datetime: this.$format.datetime(d),
        time: this.$format.time(d)
      }
    },
    copyWmsServiceUrl () {
      const url = combineURLs(location.origin, `/api/map/ows/${this.projectName}?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetCapabilities`)
      navigator.clipboard.writeText(url)
    }
  }
}
</script>

<style lang="scss" scoped>
.project-page {
  // width: clamp(600px, 100%, 1200px);
  // align-self: center;

  // min-height: 0;
  // flex: 1 1 0;
  overflow: hidden;
  // display: grid;
  // grid-template-columns: auto 1fr;
  border-top: solid 4px #3d3d3d;
  border-bottom: solid 4px #3d3d3d;
  @media (max-width: 1200px) {
    grid-column: 2 / 4;
  }
}
.panel {
  // background-color: var(--color-dark);
  background-color: #3d3d3d;
}
.menubar {
  background-color: #eee;
  border: 1px solid #ddd;

  a {
    // font-weight: 500;
    color: inherit;
    text-decoration: none;
    &.router-link-exact-active, &.router-link-active:not(.general) {
      color: var(--color-primary);
      --icon-color: currentColor;
      font-weight: 500;
    }
  }
}

.menubar2 {
  a {
    // font-weight: 500;
    color: inherit;
    text-decoration: none;
    &.router-link-exact-active, &.router-link-active:not(.general) {
      color: var(--color-yellow);
      --icon-color: currentColor;
      font-weight: 500;
    }
  }
  .btn.small {
    padding-inline: 2px;
  }
}

.header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: 1fr auto;
  gap: 8px;
  padding: 8px 12px;
  // background-color: var(--color-primary);
  // background-color: var(--color-dark);
  background: linear-gradient(to right, #444, hsl(0, 4%, 35%));
  background: linear-gradient(175deg, rgb(83, 91, 119), hsl(0, 4%, 35%));
  background: linear-gradient(175deg, rgb(42, 60, 80), hsl(0, 4%, 35%));
  // background: linear-gradient(175deg, rgb(42, 53, 70), hsl(0, 4%, 35%));
  border: 1px solid rgba(#bbb, 0.4);
  .thumbnail {
    // max-height: 120px;
    // max-width: 100%;
    // width: auto;
    // height: auto;
    grid-row: 1 / 3;
    // justify-self: center;
    // align-self: center;
    position: relative;
    background-color: #fff;
    svg, img {
      // width: auto;
      // height: auto;
      max-width: 180px;
      max-height: 120px;
    }
    small {
      font-weight: bold;
      font-size: 11px;
      color: #999;
    }
  }
  .text {
    .title {
      align-self: start;
      font-size: 20px;
      .edit {
        transition: opacity .25s cubic-bezier(.25,.8,.25,1);
        transition-delay: 0.25s;
      }
      &:not(:hover) {
        .edit {
          opacity: 0;
        }
      }
      ::v-deep input::placeholder {
        color: var(--color-orange);
        opacity: 0.75;
      }
    }
  }
  .details {
    font-size: 13px;
    font-weight: 500;
    // opacity: 0.8;
    grid-column: 2 / 3;
  }
  .time-info {
    text-align: right;
    font-size: 13.5px;
  }
  .auth {
    grid-area: 1 / 3 / 2 / 4;
    align-self: start;
    justify-self: end;
  }
}

.card {
  background-color: #f2f2f2;
  border: 1px solid #ddd;
}
.date {
  display: grid;
  grid-template-columns: 1fr auto auto;
  // grid-template-columns: 1fr auto auto auto auto;
  row-gap: 2px;
  column-gap: 6px;
  text-align: right;
  .icon {
    grid-column: 2 / 3;
  }
}
.vjs-tree, .json-viewer, .json-diff-viewer {
  width: clamp(50vw, 1260px, 80vw);
  min-height: 90vh;
  padding: 12px;
  overflow: auto;
}
.dialog {
  .toolbar {
    height: 38px;
    flex-shrink: 0;
    background-color: #444;
    background-color: var(--color-dark);
    border-bottom: 1px solid #ddd;
    --fill-color: #fff;
    .title {
      font-size: 17px;
      font-weight: 500;
    }
  }
  .error-dialog {
    .toolbar {
      background-color: var(--color-red);
    }
  }
}
.json-dialog {
  overflow: hidden;
}
.left-panel {
  grid-area: 2 / 1 / 3 / 2;
  // background-position-x: -100;
  // background-origin: 0 0;
}
.left-panel, .right-panel {
  min-height: 0;
  max-height: 100%;
  // background-color: rgb(83, 91, 119);
  background-color: #3d3d3d;
  // background-color: #505050;
  // background-color: #e0e0e0;

  // background: url('~@/assets/bg3.svg') no-repeat;
  background-size: auto 100%;
}
.errors {
  min-width: 320px;
  max-width: 400px;
  font-size: 15px;
  ul {
    padding-left: 20px;
    font-weight: 500;
    li {
      padding-block: 3px;
    }
  }
}
.projections-settings {
  width: clamp(50vw, 960px, 80vw);
  overflow: auto;
}
.icon[role="button"] {
  cursor: pointer;
}
</style>
