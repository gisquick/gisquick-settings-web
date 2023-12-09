<template>
  <div class="topics">
    <!-- <div class="toolbar dark">
      <span class="title">Topics</span>
    </div> -->
    <div class="f-col panel box">
      <v-list
        class="flat f-grow m-0"
        item-key="id"
        empty-text="No Topics"
        item-text="title"
        :items="topics"
        :selected="selectedTopic.id"
        @click-item="selectTopic"
        :reorderable="true"
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
              :value="topicLayersLookup[item.id]"
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
// import { filterLayers } from '@/utils/layers'

export default {
  name: 'TopicsEditor',
  components: { LayersTable },
  props: {
    // topics: Array,
    layers: Array,
    settings: Object
  },
  data () {
    return {
      selectedTopic: 0,
      collapsed: []
    }
  },
  computed: {
    topics () {
      return this.settings.topics
    },
    availableLayers () {
      return this.layers
      // return filterLayers(this.layers, l => !this.settings.layers[l.id].hidden)
    },
    activeTopic () {
      return this.selectedTopic
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
        visible_overlays: []
      })
    },
    removeSelectedTopic () {
      // if (this.selectedIndex >= 0) {
      const selectedIndex = this.topics.find(topic => topic === this.selectedTopic)
      this.topics.splice(selectedIndex, 1)
    },
    toggleLayer (layer, group) {
      if (this.topicLayersLookup[layer.id]) {
        this.activeTopic.visible_overlays = this.activeTopic.visible_overlays.filter(id => id != layer.id)
      } else {
        if (group?.mutually_exclusive) {
          const exclude = group.layers.filter(l => this.topicLayersLookup[l.id] && l !== layer).map(l => l.id)
          this.activeTopic.visible_overlays = this.activeTopic.visible_overlays.filter(id => !exclude.includes(id))
        }
        this.activeTopic.visible_overlays.push(layer.id)
      }
    },
    selectTopic (item, index) {
      this.selectedTopic = item
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
