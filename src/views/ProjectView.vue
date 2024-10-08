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
      <projections-settings
        v-if="project"
        :meta="project.meta"
        :settings="settings"
      />
    </v-dialog>
    <v-dialog ref="importDialog" title="Import Settings">
      <template v-slot="{ close }">
        <settings-import
        v-if="project"
        :meta="project.meta"
        :settings="settings"
        @import="close"
      />
      </template>
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
          <router-link class="m-2" :to="{name: 'search'}">Search</router-link>
          <router-link class="m-2" :to="{name: 'access'}">Permissions</router-link>
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
import mapKeys from 'lodash/mapKeys'
import cloneDeep from 'lodash/cloneDeep'
import isEqual from 'lodash/isEqual'
import combineURLs from 'axios/lib/helpers/combineURLs'

import ConfirmDialog from '@/components/ConfirmDialog.vue'
import QgisLayersInfo from '@/components/QgisLayersInfo.vue'
import JsonViewer from '@/components/JsonViewer.vue'
// import JsonViewer2 from '@/components/JsonViewer2.vue'
import JsonViewer2 from '@/components/JsonDiffViewer.vue'
import ProjectionsSettings from '@/components/ProjectionsSettings.vue'
import SettingsImport from '@/components/SettingsImport.vue'
import { scalesToResolutions, ProjectionsScales } from '@/utils/scales'
import { TaskState, watchTask } from '@/tasks'
import { objectDiff } from '@/utils/diff'
import { validateSettings } from '@/utils/project'

import MapImg from '@/assets/map.svg?component'

export default {
  name: 'ProjectView',
  components: { ConfirmDialog, QgisLayersInfo, MapImg, JsonViewer, JsonViewer2, ProjectionsSettings, SettingsImport },
  props: {
    user: String,
    name: String,
    // props when redirected from Publish View
    publishedProject: Object, // mismatch with PublishView!
    template: String
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
      return this.fetchTask.data
      // return this.publishedProject || this.fetchTask.data
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
        { text: 'Import Settings', icon: 'swap', action: () => this.$refs.importDialog.show() },
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
    }
  },
  async created () {
    if (this.publishedProject) {
      if (this.template) {
        try {
          const { data: templateProject } = await this.$http.get(`/api/project/full-info/${this.template}`)
          const settings = this.newSettingsFromTemplate(templateProject, this.publishedProject)
          settings.template = this.template
          this.settings = settings
        } catch (err) {
          console.error(err)
          this.$notify.error('Failed to import project settings')
          this.settings = this.newSettings(this.publishedProject.meta)
        }
      } else {
        this.settings = this.newSettings(this.publishedProject.meta)
      }
      this.project = {
        ...this.publishedProject,
        files: this.createFilesTask()
      }
    } else {
      this.loadProject()
    }
  },
  provide () {
    return {
      fetchProjectInfo: this.loadProject
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
    newSettingsFromTemplate (template, project) {
      let settings = cloneDeep(template.settings)

      // remap layers ids by layer name when id doesn't match
      const map = Object.entries(template.meta.layers).reduce((m, [lid, l]) => (m[l.name] = lid, m), {})
      const mapping = {}
      Object.entries(project.meta.layers).forEach(([lid, l]) => {
        if (!template.meta.layers[lid] && map[l.name]) {
          mapping[map[l.name]] = lid
        }
      })
      if (Object.keys(mapping).length > 0) {
        const remapObj = (obj, key) => (obj[key] = mapKeys(obj[key], (_, lid) => mapping[lid] || lid))
        const remapArray = (obj, key) => (obj[key] = obj[key]?.map(lid => mapping[lid] || lid))
        remapObj(settings, 'layers')
        settings.auth.roles?.forEach(role => {
          remapObj(role.permissions, 'layers')
          remapObj(role.permissions, 'attributes')
        })
        remapArray(settings, 'base_layers')
        settings.topics?.forEach(t => remapArray(t, 'visible_overlays'))
      }

      // override selected attributes
      settings.title = project.meta.title
      settings.extent = project.meta.extent
      const baseLayers = settings.base_layers || project.meta.base_layers
      settings.base_layers = baseLayers?.filter(id => project.meta.layers_tree.some(item => item.id === id)) ?? []

      // create final  validated settings
      return validateSettings(settings, project.meta)
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
        settings_auth: { users: null },
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
    async loadProject () {
      const task = this.$http.get(`/api/project/full-info/${this.projectName}`)
      // watchTask(task, this.fetchTask).then(({ data }) => {
      //     this.fetchedProject = data
      //     const { meta, settings } = data
      //     this.settings = settings ? cloneDeep(settings) : this.newSettings(meta)
      //   })

      const { data } = await watchTask(task, this.fetchTask)
      if (this.fetchTask.success) {
        const { meta, settings } = data
        if (settings) {
          this.settings = validateSettings(cloneDeep(settings), meta)
        } else {
          this.settings = cloneDeep(this.newSettings(meta))
        }
        this.project = {
          ...data,
          files: this.createFilesTask()
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
      this.loadProject()
    },
    resetSettings () {
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
