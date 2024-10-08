<template>
  <div class="settings-import f-col">
    <div class="content f-col f-grow">
      <v-autocomplete
        label="Source project"
        placeholder="Select project"
        class="filled inline"
        v-if="projects"
        :items="projects"
        item-value="name"
        filter-fields="name,title"
        highlight-fields="name,title"
        v-model="srcProject"
      >
        <template v-slot:item="{ item, html }">
          <div class="ac-item f-row f-grow">
            <div class="f-grow">
              <div class="title" v-html="html.name"/>
              <div class="f-row">
                <small v-html="html.title" class="f-grow mr-2"/>
                <!-- <small>{{ item.created }}</small> -->
              </div>
            </div>
          </div>
        </template>
      </v-autocomplete>
      <!-- <div v-if="sourceSettings">
        {{ sourceSettings.layers }}
      </div> -->
      <template v-if="template && hasCompatibileLayers">
        <div class="label m-2">Layers</div>
        <layers-table
          label="Layer"
          :items="layersTree"
          :columns="[]"
          :collapsed.sync="collapsed"
        >
          <template v-slot:leaf="{ item }">
            <v-checkbox
              :label="item.title"
              :val="item.name"
              v-model="selectedLayers"
            />
          </template>
        </layers-table>
        <!-- <v-checkbox
          v-for="(i, n) in layersMap"
          :key="n"
          :label="i.title"
          :val="n"
          v-model="selectedLayers"
        /> -->
        <template v-if="permissionsList.length">
          <div class="label m-2">Permissions</div>
          <v-checkbox
            v-for="(p, i) in permissionsList"
            :key="i"
            :label="p.name"
            :val="p.name"
            v-model="selectedRoles"
          />
        </template>
      </template>
      <div v-else-if="template" class="mx-2 my-auto text-center">
        Selected project does not have any compatibile layers.
      </div>
    </div>
    <hr/>
    <div class="toolbar f-row-ac f-justify-end">
      <v-btn
        color="primary"
        :disabled="!template || !hasCompatibileLayers"
        @click="importSettings"
      >
        Import
      </v-btn>
    </div>
  </div>
</template>

<script>
import mapKeys from 'lodash/mapKeys'
import keyBy from 'lodash/keyBy'
import cloneDeep from 'lodash/cloneDeep'

import VAutocomplete from '@/ui/Autocomplete.vue'
import LayersTable from '@/components/LayersTable.vue'
import { validateSettings } from '@/utils/project'
import { filterLayers, transformLayersTree } from '@/utils/layers'
// import { TaskState, watchTask } from '@/tasks'

export default {
  components: { VAutocomplete, LayersTable },
  props: {
    meta: Object,
    settings: Object
  },
  data () {
    return {
      srcProject: null,
      template: null,
      projects: null,
      selectedLayers: [],
      selectedRoles: [],
      collapsed: []
    }
  },
  computed: {
    sourceSettings () {
      const template = this.template
      if (template) {
        let settings = cloneDeep(template.settings)
        // remap layers ids by layer name when id doesn't match
        const templateLayersByName = keyBy(template.meta.layers, 'name')
        const mapping = {}
        Object.entries(this.meta.layers).forEach(([lid, l]) => {
          if (!template.meta.layers[lid] && templateLayersByName[l.name]) {
            mapping[templateLayersByName[l.name].id] = lid
          }
        })
        if (Object.keys(mapping).length > 0) {
          const remapObj = (obj, key) => (obj[key] = mapKeys(obj[key], (_, lid) => mapping[lid] || lid))
          // const remapArray = (obj, key) => (obj[key] = obj[key]?.map(lid => mapping[lid] || lid))
          remapObj(settings, 'layers')
          settings.auth.roles?.forEach(role => {
            remapObj(role.permissions, 'layers')
            remapObj(role.permissions, 'attributes')
          })
          // remapArray(settings, 'base_layers')
          // settings.topics?.forEach(t => remapArray(t, 'visible_overlays'))
        }
        return settings
      }
      return null
    },
    layersMap () {
      if (this.template) {
        const templateLayers = mapKeys(this.template.meta.layers, l => l.name)
        const map = {}
        Object.entries(this.meta.layers).forEach(([id, l]) => {
          const tLayer = templateLayers[l.name]
          if (tLayer) {
            map[l.name] = {
              // name: l.name,
              title: l.title,
              srcId: tLayer.id,
              destId: id
            }
          }
        })
        return map
      }
      return null
    },
    hasCompatibileLayers () {
      return this.layersMap && Object.keys(this.layersMap).length > 0
    },
    layersTree () {
      const byId = keyBy(this.layersMap, 'destId')
      console.log(byId)
      let tree = this.meta.layers_tree
      tree = filterLayers(tree, l => byId[l.id])
      return transformLayersTree(
        tree,
        l => ({ ...this.meta.layers[l.id] }),
        (g, layers) => ({ ...g, layers })
      )
    },
    permissionsList () {
      return this.sourceSettings?.auth?.roles ?? []
    }
  },
  watch: {
    srcProject (project) {
      this.template = null
      if (project) {
        this.fetchProjectInfo(project)
      }
    }
  },
  created () {
    this.fetchProjects()
  },
  methods: {
    async fetchProjects () {
      const { data } = await this.$http.get('/api/projects?filter=accessible')
      this.projects = data
    },
    async fetchProjectInfo () {
      try {
        const { data } = await this.$http.get(`/api/project/full-info/${this.srcProject}`)
        this.template = data
      } catch (err) {
        console.error(err)
        this.$notify.error('Failed to load project settings')
      }
    },
    importSettings () {
      this.selectedLayers.forEach(name => {
        const { srcId, destId } = this.layersMap[name]
        // this.$set(this.settings.layers, destId, this.template.settings.layers[srcId])
        this.settings.layers[destId] = this.template.settings.layers[srcId]
      })

      if (this.selectedRoles.length > 0) {
        const roles = this.settings.auth.roles?.slice() ?? []
        this.selectedRoles.forEach(name => {
          const role = this.sourceSettings.auth.roles.find(r => r.name === name)
          const index = roles.findIndex(r => r.name === name)
          if (index !== -1) {
            roles[index] = role
          } else {
            roles.push(role)
          }
        })
        // this.settings.auth.roles = roles
        this.$set(this.settings.auth, 'roles', roles)
      }
      validateSettings(this.settings, this.meta)
      this.$emit('import')
    }
  }
}
</script>

<style lang="scss" scoped>
.settings-import {
  min-width: 500px;
  min-height: 300px;
  .content {
    overflow: auto;
  }
  .label {
    font-size: 12px;
    font-weight: 500;
    text-transform: uppercase;
    color: #777;
  }
}
</style>
