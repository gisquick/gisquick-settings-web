<template>
  <div v-if="authSettingsValid" class="page-content f-col f-grow light">
    <tabs-header v-if="projectSuperuserAccess" class="main mb-4" :items="tabs" v-model="tab"/>
    <template v-if="tab === 'map'">
    <div class="l-col2">
      <v-select
        class="filled"
        label="Map Access"
        :items="accessOptions"
        :value="settings.auth.type"
        @input="setAuthType"
      />
      <v-switch
        class="round my-4"
        color="primary"
        label="Multiple roles permissions"
        :value="!!settings.auth.roles"
        @input="toggleRolesMode"
      />
      <users-list
        v-if="settings.auth.type === 'users'"
        :task="tasks.users"
        v-model="settings.auth.users"
      />
    </div>
    <!-- <div class="my-2"/>
    <radio-group
      label="Permissions Model"
      color="primary"
      :items="permModes"
      :value="mode"
      @input="setModel"
    /> -->

    <div
      v-if="settings.auth.roles"
      class="roles-settings mt-4"
    >
      <confirm-dialog
        ref="confirmDeleteDialog"
        :action="removeRole"
        icon="warning"
        text="Are you sure to delete access group?"
      />
      <template>
        <!-- <div class="toolbar f-row-ac">
          <v-btn @click="addRole">
            <v-icon name="plus"/>
            <span>New</span>
          </v-btn>
          <v-btn :disabled="!selectedRole" @click="removeRole">
            <v-icon name="delete_forever"/>
            <span>Delete</span>
          </v-btn>
        </div> -->

        <v-list
          class="roles-panel"
          empty-text="Empty"
          :items="settings.auth.roles"
          :selected="selectedIndex"
          @click-item="selectRole"
        >
          <template v-slot:item="{ item }">
            <span v-text="item.name"/>
          </template>
          <template v-slot:prepend>
            <div class="toolbar f-row-ac">
              <span class="label px-2 f-grow">Groups</span>
              <v-btn class="icon small m-1" @click="addRole">
                <v-icon name="plus"/>
              </v-btn>
              <v-btn class="icon small m-1" :disabled="!selectedRole" @click="$refs.confirmDeleteDialog.show()">
                <v-icon name="delete_forever"/>
              </v-btn>
            </div>
          </template>

          <!-- <template v-slot:append>
            <div class="toolbar f-row-ac">
              <v-btn @click="addRole">
                <v-icon name="plus"/>
                <span>New</span>
              </v-btn>
              <v-btn :disabled="!selectedRole" @click="removeRole">
                <v-icon name="delete_forever"/>
                <span>Delete</span>
              </v-btn>
            </div>
          </template> -->
        </v-list>
      </template>

      <div v-if="selectedRole" class="role-settings f-col">
        <text-tabs-header
          :items="roleTabs"
          v-model="roleTab"
        />
        <!-- <div class="tabs-header f-row-ac">
          <div
            v-for="tab in roleTabs"
            :key="tab.key"
            role="button"
            class="tab"
            :class="{active: roleTab === tab.key}"
            @click="roleTab = tab.key"
          >
            <span v-text="tab.label"/>
          </div>
        </div> -->
        <div v-if="roleTab === 'settings'" class="role-config f-col">
          <v-text-field
            class="filled"
            label="Name"
            lazy
            v-model="selectedRole.name"
          />
          <!-- <v-select
            class="filled"
            label="Access"
            :items="rolesTypes"
            v-model="selectedRole.type"
          /> -->
          <radio-group
            label="Access"
            color="primary"
            :items="rolesTypes"
            v-model="selectedRole.type"
          >
            <template v-slot:item-append="{ item }">
              <span v-if="item.desc" class="desc-text ml-2">({{ item.desc }})</span>
            </template>
          </radio-group>
          <template v-if="selectedRole.type === 'users'">
            <v-select
              v-if="settings.auth.type === 'users'"
              label="Users"
              class="filled"
              placeholder="Users"
              item-value="username"
              item-text="full_name"
              :items="projectUsers"
              v-model="selectedRole.users"
              multiple
            />
            <users-list
              v-else
              :task="tasks.users"
              v-model="selectedRole.users"
            />
          </template>
        </div>
        <layers-table
          v-if="selectedRole && roleTab === 'base-layers'"
          key="base-layers"
          label="Layer name"
          :items="baseLayers"
          :columns="baseLayersColumns"
          :collapsed.sync="collapsedLayers"
        >
          <!-- eslint-disable-next-line -->
          <template v-slot:leaf.perms="{ item }">
            <v-btn
              class="icon flat"
              :color="selectedRole.permissions.layers[item.id].includes('view') ? 'primary' : '#777'"
              @click="toggleBaseLayerPermission(item)"
            >
              <v-icon name="visibility" size="18"/>
            </v-btn>
          </template>
        </layers-table>
        <layers-table
          v-if="selectedRole && roleTab === 'overlays'"
          key="overlays"
          label="Layer name"
          :detail="attributesDetail"
          :items="overlays"
          :columns="overlaysColumns"
          :collapsed.sync="collapsedLayers"
          @click:row="toggleAttributes"
        >
          <!-- eslint-disable-next-line -->
          <template v-slot:header.perms="{ text }">
            <th class="header text-right" width="1">
              <div class="f-row-ac f-justify-end">
                <span v-text="text"/>
                <v-btn
                  class="icon flat"
                  :color="linkedLayersGroup === projectOverlaysGroup ? 'primary' : ''"
                  @click="toggleGroupLink(projectOverlaysGroup)"
                >
                  <v-tooltip slot="tooltip" align="c;bb">
                    <span>Group editing of all layers</span>
                  </v-tooltip>
                  <v-icon name="link-chain"/>
                </v-btn>
              </div>
            </th>
          </template>

          <!-- eslint-disable-next-line -->
          <template v-slot:group.perms="{ group }">
            <v-btn
              class="group-link icon flat"
              :color="linkedLayersGroup === group ? 'primary' : ''"
              @click="toggleGroupLink(group)"
            >
              <v-tooltip slot="tooltip" align="c;bb">
                <span>Group layers editing</span>
              </v-tooltip>
              <v-icon name="link-chain"/>
            </v-btn>
          </template>

          <!-- eslint-disable-next-line -->
          <template v-slot:leaf.perms="{ item }">
            <layer-permissions-flags
              :capabilities="layersPermissionsCapabilities[item.id]"
              :value="layersPerms[item.id]"
              @change="updateLayerFlag(item.id, $event)"
            />
            <template v-if="item.attributes">
              <div class="v-separator"/>
              <v-btn
                class="icon flat"
                :color="attributesDetail === item.id ? 'orange' : '#777'"
                @click="toggleAttributes(item)"
              >
                <v-icon name="attribute-table" size="18"/>
                <!-- <v-icon name="arrow-down" size="12" class="ml-2" opacity="0.5"/> -->
                <!-- or maybe toggle button style? -->
              </v-btn>
            </template>
            <div v-else class="end-padding"/>
          </template>

          <!-- eslint-disable-next-line -->
          <template v-slot:detail="{ layer, indentStyle }">
            <tr :key="`header:${layer.id}`">
              <td class="detail-header" :style="indentStyle">
                <span class="f-row-ac f-grow">Attributes</span>
              </td>
              <td class="attrs-flags-panel">
                <attributes-permissions-flags
                  :layer="layer"
                  :layer-capabilities="layersPermissionsCapabilities[layer.id]"
                  :layer-permissions="layersPerms[layer.id]"
                  :layer-settings="settings.layers[layer.id]"
                  :values="attrsPerms[layer.id]"
                  class="f-justify-end"
                />
              </td>
            </tr>
            <tr v-for="attr in layer.attributes" :key="attr.name" class="detail">
              <td>
                <div :style="indentStyle" class="f-row-ac">{{ attr.alias || attr.name }}</div>
              </td>
              <td>
                <attribute-permissions-flags
                  :attribute-meta="attr"
                  :layer-capabilities="layersPermissionsCapabilities[layer.id]"
                  :layer-permissions="layersPerms[layer.id]"
                  :layer-settings="settings.layers[layer.id]"
                  :value="attrsPerms[layer.id][attr.name]"
                  class="f-justify-end"
                />
              </td>
            </tr>
            <tr :key="`geometry:${layer.id}`">
              <td class="detail-header" :style="indentStyle">
                <span class="f-row-ac f-grow mx-2">Geometry</span>
              </td>
              <td class="geometry-panel f-row f-justify-end">
                <geometry-permissions-flags
                  :layer-permissions="layersPerms[layer.id]"
                  :layer-capabilities="layersPermissionsCapabilities[layer.id]"
                  :value="attrsPerms[layer.id]['geometry']"
                />
              </td>
            </tr>
          </template>
        </layers-table>

        <v-list
          v-if="selectedRole && roleTab === 'topics'"
          class="topics-perms"
          label="Visible Topics"
          :items="settings.topics"
        >
          <template v-slot:item="{ item: topic, index }">
            <div class="topic-item">
              <span class="title" v-text="topic.title"/>
              <v-checkbox :value="roleTopicsSet.has(topic.id)" @input="toggleTopicVisibility(topic.id)"/>
              <span class="layers">
                <span
                  v-for="layer in topicsLayers[index]"
                  :key="layer.id"
                  :disabled="!layer.visible"
                  v-text="layer.title"
                />
              </span>
            </div>
          </template>
        </v-list>
      </div>
    </div>
    </template>
    <template v-else>
      <div class="l-col2">
        <users-list
          label="Admin Users"
          :task="tasks.users"
          v-model="settings.settings_auth.admin_users"
        />
      </div>
    </template>

  </div>
  <div v-else class="m-4 f-col-ac">
    <div class="error f-row-ac my-4">
      <v-icon name="warning" class="mr-2"/>
      <span>Invalid Authentication Settings</span>
    </div>
    <v-btn color="primary" @click="initAuthSettings">
      New Authentication Settings
    </v-btn>
  </div>
</template>

<script>
import mapValues from 'lodash/mapValues'
import has from 'lodash/has'
import UsersList from '@/components/UsersList.vue'
import LayersTable from '@/components/LayersTable.vue'
import RadioGroup from '@/ui/RadioGroup.vue'
import TextTabsHeader from '@/ui/TextTabsHeader.vue'
import AttributePermissionsFlags from '@/components/AttributePermissionsFlags.vue'
import AttributesPermissionsFlags, { toggleAttributePermissionsFlag } from '@/components/AttributesPermissionsFlags.vue'
import LayerPermissionsFlags from '@/components/LayerPermissionsFlags.vue'
import GeometryPermissionsFlags from '@/components/GeometryPermissionsFlags.vue'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import TabsHeader from '@/ui/TabsHeader.vue'

import { extend, pull, hasAny } from '@/utils/collections'
import { transformLayersTree, layersList } from '@/utils/layers'
import { initLayersPermissions } from '@/utils/project'
import { layerCapabilities, layerPermissionsCapabilities } from '@/flags'
import { TaskState, watchTask } from '@/tasks'

function fullName (user) {
  const parts = [ user.first_name, user.last_name ]
  return parts.filter(p => p).join(' ')
}


export default {
  name: 'ProjectAccess',
  components: {
    ConfirmDialog, UsersList, LayersTable, TextTabsHeader, RadioGroup, TabsHeader,
    AttributePermissionsFlags, AttributesPermissionsFlags, LayerPermissionsFlags, GeometryPermissionsFlags
  },
  props: {
    project: Object,
    settings: Object
  },
  data () {
    return {
      tab: 'map',
      // auth: 'users',
      users: [],
      collapsedLayers: [],
      selectedIndex: 0,
      attributesDetail: null,
      roleTab: 'settings',
      linkedLayersGroup: null,
      tasks: {
        users: TaskState()
      }
    }
  },
  computed: {
    tabs () {
      return [
        { key: 'map', icon: 'map', label: 'Map permissions' },
        { key: 'settings', icon: 'settings', label: 'Settings permissions' }
      ]
    },
    authSettingsValid () {
      const { auth } = this.settings
      return !!auth && has(auth, 'type')// && has(auth, 'roles')
    },
    accessOptions () {
      return [
        { text: 'Public', value: 'public' },
        { text: 'Private', value: 'private' },
        { text: 'Authenticated', value: 'authenticated' },
        { text: 'Selected Users', value: 'users' }
      ]
    },
    permModes () {
      return [
        { text: 'Read-only access to the whole content', value: 'simple' },
        { text: 'Single permissions group', value: 'advanced' },
        { text: 'Multiple permissions groups', value: 'roles' }
      ]
    },
    rolesTypes () {
      return [
        { text: 'All', value: 'all' },
        {
          text: 'Selected Users',
          value: 'users',
          // desc: 'Group of listed users'
        },
        {
          text: 'All authenticated users',
          value: 'authenticated',
          // desc: 'All authenticated users'
        }, // if settings.auth === 'public'
        // { text: 'Anonymous', value: 'anonymous' }, // if settings.auth === 'public' // maybe not needed
        {
          text: 'Other',
          value: 'other',
          desc: 'Special group of users not matched by any other role/group'
        }
      ]
    },
    roleTabs () {
      return [
        { label: 'Role Settings', key: 'settings' },
        { label: 'Base Layers', key: 'base-layers', disabled: !this.settings.base_layers.length },
        { label: 'Layers & Attributes', key: 'overlays', disabled: !this.overlays.length },
        { label: 'Topics', key: 'topics', disabled: !this.settings.topics.length }
      ].filter(i => !i.disabled)
    },
    selectedRole () {
      return this.settings.auth?.roles?.[this.selectedIndex]
    },
    layersPerms () {
      return this.selectedRole?.permissions?.layers
    },
    attrsPerms () {
      return this.selectedRole?.permissions?.attributes
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
    overlays () {
      const meta = this.project.meta
      const overlaysTree = meta.layers_tree.filter(i => !this.settings.base_layers.includes(i.id || i.name))
      return transformLayersTree(
        overlaysTree,
        l => ({ ...meta.layers[l.id] }),
        (g, layers) => ({ name: g.name, layers })
      )
    },
    baseLayersColumns () {
      return [{
        text: 'Permissions',
        value: 'perms',
        align: 'right',
        header: { width: 1 },
      }]
    },
    overlaysColumns () {
      return [{
        text: 'Permissions',
        value: 'perms',
        align: 'right',
        header: { width: 1 }
      }]
    },
    projectUsers () {
      if (this.tasks.users.success) {
        const usernames = new Set(this.settings.auth.users)
        return this.tasks.users.data.filter(u => usernames.has(u.username))
      }
      return []
    },
    layersProjectCapabilities () {
      return mapValues(this.project.meta.layers, l => layerCapabilities(l, this.settings.layers[l.id]))
    },
    layersPermissionsCapabilities () {
      return mapValues(this.project.meta.layers, l => layerPermissionsCapabilities(
        this.layersProjectCapabilities[l.id], this.settings.layers[l.id]?.flags, this.layersPerms[l.id])
      )
    },
    roleTopicsSet () {
      return new Set(this.selectedRole?.permissions.topics)
    },
    topicsLayers () {
      return this.settings.topics.map(t => t.visible_overlays.map(lid => ({
        id: lid,
        title: this.project.meta.layers[lid].title,
        visible: this.layersPerms[lid].includes('view')
      })))
    },
    projectOverlaysGroup () {
      return { layers: this.overlays }
    },
    linkedLayersIds () {
      if (this.linkedLayersGroup) {
        return layersList(this.linkedLayersGroup.layers).map(l => l.id)
      }
      return null
    },
    projectSuperuserAccess () {
      return this.$root.user.is_superuser || this.project.name.split('/')[0] === this.$root.user.username
    }
  },
  mounted () {
    this.fetchUsers()
  },
  methods: {
    initAuthSettings () {
      this.$set(this.settings, 'auth', { type: 'private', users: null, roles: null })
    },
    createRole (params) {
      return {
        name: 'New',
        type: 'users',
        ...params,
        users: [],
        permissions: {
          ...initLayersPermissions(this.project.meta.layers),
          topics: this.settings.topics.map(t => t.id)
        }
      }
    },
    setAuthType (type) {
      if (type !== 'users' && this.settings.auth.users) {
        this.$delete(this.settings.auth, 'users')
      }
      if (type === 'users' && !this.settings.auth.users) {
        this.$set(this.settings.auth, 'users', [])
      }
      this.settings.auth.type = type
    },
    async fetchUsers () {
      const setFullName = u => {
        u.full_name = fullName(u)
      }
      const task = this.$http.get('/api/users').then(resp => {
        resp.data.forEach(setFullName)
        return resp
      })
      watchTask(task, this.tasks.users)
    },
    addRole () {
      this.settings.auth.roles.push(this.createRole())
    },
    removeRole () {
      this.settings.auth.roles = this.settings.auth.roles.filter(r => r !== this.selectedRole)
      this.selectedIndex = 0
    },
    selectRole (_, index) {
      this.selectedIndex = index
    },
    toggleBaseLayerPermission (layer) {
      const visible = this.selectedRole.permissions.layers[layer.id].includes('view')
      this.selectedRole.permissions.layers[layer.id] = visible ? [] : ['view']
    },
    toggleAttributes (layer) {
      if (layer.attributes) {
        this.attributesDetail = this.attributesDetail === layer.id ? null : layer.id
      }
    },
    toggleRolesMode (enable) {
      if (enable) {
        this.$set(this.settings.auth, 'roles', this._rolesBackupValue ?? [])
      } else {
        this._rolesBackupValue = this.settings.auth.roles
        this.$delete(this.settings.auth, 'roles')
      }
    },
    toggleTopicVisibility (id) {
      const { permissions } = this.selectedRole
      if (!permissions.topics) {
        this.$set(permissions, 'topics', [])
      }
      if (this.roleTopicsSet.has(id)) {
        pull(permissions.topics, id)
      } else {
        permissions.topics.push(id)
      }
    },
    clearAttributesFlags (layerId, ...flags) {
      const attrsPerms = this.attrsPerms[layerId]
      if (attrsPerms) {
        Object.values(attrsPerms).forEach(perms => pull(perms, ...flags))
      }
    },
    updateLayerFlag (layerId, { flag, value }) {
      const layersIds = this.linkedLayersIds?.includes(layerId) ? this.linkedLayersIds : [layerId]
      layersIds.forEach(lid => {
        const layer = this.project.meta.layers[lid]
        const lperms = this.layersPerms[lid]
        const capabilities = this.layersPermissionsCapabilities[lid]
        if (value) {
          if (capabilities[flag]) {
            extend(lperms, flag)
            const attrsPerms = this.attrsPerms[lid]
            if (attrsPerms) {
              const layerSettings = this.settings.layers[lid]
              if (flag === 'view') {
                if (this.layersPerms[lid].includes('query')) {
                  toggleAttributePermissionsFlag(attrsPerms, 'view', value, layer, layerSettings, lperms)
                }
              } else if (flag === 'query') {
                toggleAttributePermissionsFlag(attrsPerms, 'view', value, layer, layerSettings, lperms)
              } else if (flag === 'export') {
                toggleAttributePermissionsFlag(attrsPerms, 'export', value, layer, layerSettings, lperms)
              } else { // update, insert, delete
                const isEmpty = Object.values(attrsPerms).every(v => !v.includes('edit')) //&& attrsPerms.geometry?.includes('edit')
                if (isEmpty) {
                  toggleAttributePermissionsFlag(attrsPerms, 'edit', value, layer, layerSettings, lperms)
                }
              }
            }
          }
        } else {
          pull(lperms, flag)
          if (flag === 'query') {
            pull(lperms, 'export', 'update', 'insert', 'delete')
            this.clearAttributesFlags(lid, 'view', 'edit', 'export')
          } else if (flag === 'update' || flag === 'insert' || flag === 'delete') {
            if (!hasAny(lperms, 'update', 'insert', 'delete')) {
              this.clearAttributesFlags(lid, 'edit')
            }
          } else {
            this.clearAttributesFlags(lid, flag)
          }
        }
      })
    },
    toggleGroupLink (group) {
      this.linkedLayersGroup = this.linkedLayersGroup === group ? null : group
    }
  }
}
</script>

<style lang="scss" scoped>
.users-list {
  // max-width: 400px;
  display: flex;
  flex-direction: column;
}
.l-col2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: start;
  .switch {
    align-self: end;
    justify-self: start;
  }
}
// .l-col2 {
//   display: flex;
//   flex-direction: column;
//   max-width: 460px;
// }
.header-bar {
  // background-color: #eee;
}
.tabs-header.main {
  // align-self: center;
  // align-self: flex-start;
  // align-self: flex-end;
  ::v-deep .item {
    // min-width: 220px;
  }
  background-color: #eee;
  border-bottom: 1px solid #ddd;
}
.roles-settings {
  display: grid;
  grid-template-columns: 275px 1fr;
  gap: 6px;
  .roles-panel {
    grid-row: 1 / 3;
    align-self: start;
    grid-column: 1 / 2;
    position: sticky;
    top: 0;
    .label {
      font-weight: 500;
    }
  }
}
.access-settings {
  // border: 1px solid var(--border-color);
  // &.simple {
  //   display: flex;
  //   flex-direction: column;
  // }
  &.roles {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 6px;
    .roles-panel {
      grid-row: 1 / 3;
      align-self: start;
      grid-column: 1 / 2;
      position: sticky;
      top: 0;
      .label {
        font-weight: 500;
      }
    }
  }
}
.role-config {
  .i-field {
    max-width: 500px;
  }
}
.tabs {
  display: flex;
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #fff;
  .tab {
    height: 32px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    cursor: pointer;
    background-color: #eee;
    &.active {
      background-color: var(--color-primary);
      color: #fff;
    }
  }
}
.toolbar {
  // position: sticky;
  // top: 0;
  background-color: #eee;
  border: 1px solid #ccc;
  border-bottom: none;
}
.error {
  color: var(--color-red);
  --icon-color: currentColor;
}
.desc-text {
  opacity: 0.6;
  font-size: 13.5px;
}
.layers-table {
  margin: 6px;
  border: 1px solid #ddd;
  border-top: none;
  // .detail {
  //   .flags {
  //     margin-right: 39px;
  //   }
  // }
  .group-link {
    margin-left: auto;
  }
}
.topics-perms {
  // max-width: 500px;
  .topic-item {
    display: grid;
    grid-template-columns: 1fr auto;
    width: 100%;
    // flex-grow: 1;
    padding-block: 4px;
    cursor: default;
    .title {
      font-weight: 500;
    }
    .checkbox {
      grid-area: 1 / 2 / 3 / 3;
    }
    .layers {
      font-size: 13px;
      opacity: 0.85;
      > * {
        &[disabled="disabled"] {
          text-decoration: line-through;
          opacity: 0.5;
        }
        &:not(:last-child) {
          &::after {
            content: ", ";
          }
        }
      }
    }
  }
}
.end-padding {
  width: 40px;
}
.detail-header {
  padding-right: 0!important;
  font-size: 13px;
  font-weight: 500;
  > span {
    padding-inline: 6px;
    margin-left: 6px;
    height: inherit;
  }
}
.detail-header, .attrs-flags-panel, .geometry-panel {
  border-block: 1px solid #eee;
  background-color: rgba(var(--color-orange-rgb), 0.1);
  box-sizing: content-box;
}
</style>
