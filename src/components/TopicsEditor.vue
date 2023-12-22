<template>
  <div class="topics">
    <!-- <div class="toolbar dark">
      <span class="title">Topics</span>
    </div> -->
    <div class="f-col panel box">
      <v-list
        draggable
        class="flat f-grow m-0"
        empty-text="No Topics"
        item-text="title"
        :items="topics"
        :selected="selectedIndex"
        @click-item="selectTopic"
        @reorder="reorderTopics"
      />
      <hr/>
      <div class="toolbar f-row f-shrink">
        <v-btn class="f-grow m-0" @click="addTopic">
          <v-icon name="plus" class="mr-2"/>
          <span>Add</span>
        </v-btn>
        <v-btn class="f-grow m-0" @click="removeSelectedTopic">
          <v-icon name="minus" class="mr-2"/>
          <span>Remove</span>
        </v-btn>
      </div>
    </div>
    <div class="form py-2">
      <div class="f-col" v-if="activeTopic">
        <v-text-field
          class="filled"
          label="Title"
          v-model="activeTopic.title"
          lazy
        />
        <v-text-field
          class="filled"
          rows="3"
          label="Description"
          v-model="activeTopic.abstract"
          placeholder=""
          multiline
        />
        <layers-table
          v-if="activeTopic"
          label="Layer"
          :items="availableLayers"
          :columns="[]"
          :collapsed.sync="collapsed"
        >
          <template v-slot:leaf="{ item, group }">
            <!-- :disabled="settings.layers[item.id].hidden" -->
            <v-checkbox
              :label="item.title"
              :value="topicLayersLookup[item.id] || activeBaseLayer === item.id"
              @input="toggleLayer(item, group)"
            />
          </template>
        </layers-table>
      </div>
      <span v-else class="p-2">No topic is selected</span>
    </div>
  </div>
</template>

<script>
import LayersTable from '@/components/LayersTable.vue'
import { lookupTable } from '@/utils'
import { layersList } from '@/utils/layers'
// import { filterLayers } from '@/utils/layers'
import Vue from 'vue'

export default {
  name: 'TopicsEditor',
  components: { LayersTable },
  inject: ['settings', 'project'],
  props: {
    // topics: Array,
    layers: Array,
  },
  data () {
    return {
      selectedIndex: 0,
      collapsed: []
    }
  },
  computed: {
    topics () {
      return this.settings.topics
    },
    backgroundLayers () {
      return this.settings
    },
    availableLayers () {
      return this.layers
      // return filterLayers(this.layers, l => !this.settings.layers[l.id].hidden)
    },
    activeTopic () {
      return this.topics[this.selectedIndex]
    },
    activeBaseLayer () {
      return this.activeTopic.base_layer
    },
    topicLayersLookup () {
      return lookupTable(this.activeTopic.visible_overlays)
    }
  },
  methods: {
    addTopic () {
      do {
        var id = Math.random().toString(36).substr(2, 5)
      } while (this.topics.some(t => t.id === id))
      this.topics.push({
        id,
        title: 'New',
        abstract: '',
        visible_overlays: [],
        base_layer: null,
      })
    },
    removeSelectedTopic () {
      // if (this.selectedIndex >= 0) {
      this.topics.splice(this.selectedIndex, 1)
    },
    toggleLayer (layer, group) {
      const isBaseLayer = (layerId) => {
        const tree = this.project.meta.layers_tree.filter(i => this.settings.base_layers.includes(i.id || i.name))
        return layersList(tree).some(l => l.id === layerId)
      }

      if (isBaseLayer(layer.id)) {
        // this.activeTopic.base_layer = this.activeTopic.base_layer === layer.id ? null : layer.id
        Vue.set(this.activeTopic, 'base_layer', this.activeTopic.base_layer === layer.id ? null : layer.id)
      } else {
        if (this.topicLayersLookup[layer.id]) {
          this.activeTopic.visible_overlays = this.activeTopic.visible_overlays.filter(id => id != layer.id)
        } else {
          if (group?.mutually_exclusive) {
            const exclude = group.layers.filter(l => this.topicLayersLookup[l.id] && l !== layer).map(l => l.id)
            this.activeTopic.visible_overlays = this.activeTopic.visible_overlays.filter(id => !exclude.includes(id))
          }
          this.activeTopic.visible_overlays.push(layer.id)
        }
      }
    },
    selectTopic (item, index) {
      this.selectedIndex = index
    },
    reorderTopics ({ src, dest }) {
      const selected = this.activeTopic
      this.topics.splice(src.index, 1)
      this.topics.splice(dest.index, 0, src.item)
      this.selectedIndex = this.topics.indexOf(selected)
    }
  }
}
</script>

<style lang="scss" scoped>
.topics {
  display: grid;
  grid-template-columns: minmax(320px, 1fr) 3fr;
  grid-template-rows: auto 1fr;
  // max-height: 100%;
  .v-toolbar {
    grid-row: 1 / 2;
    grid-column: 1 / 3;
  }
  .panel {
    grid-row: 2 / 4;
    grid-column: 1 / 2;
  }
  .form {
    grid-row: 2 / 3;
    grid-column: 2 / 3;
    overflow-y: auto;
    .v-input {
      flex-grow: 0;
    }
    border: solid var(--border-color);
    border-width: 1px 1px 1px 0;
  }
  .box {
    border: 1px solid #ccc;
    // border-radius: 3px;
  }
}
</style>
