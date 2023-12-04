<template>
  <div class="bookmarks">
    <div class="f-col panel box">
      <v-scroll-area>
        <div
          v-for="[groupName, group] in Object.entries(project.meta.bookmarks)"
          :key="groupName"
        >
          <div class="group-title px-2">
            {{ groupName !== defaultGroupName ? groupName : 'Other bookmarks' }}
          </div>
          <v-list
            class="flat f-grow m-0"
            item-key="id"
            empty-text="No bookmarks"
            item-text="name"
            :items="Object.values(group)"
            :selected="selectedBookmark?.id"
            @click-item="selectBookmark"
          />
        </div>
      </v-scroll-area>
    </div>
    <div class="form py-2">
      <div class="f-col" v-if="selectedBookmark">
        <div class="px-2">
          <div class="info-grid i-card shadow-1 m-2">
            <span class="label">Name</span>
            <span v-text="selectedBookmark.name" />

            <span class="label">Group</span>
            <span v-text="selectedBookmark.group" />

            <span class="label">Rotation</span>
            <span v-text="selectedBookmark.rotation" />

            <span class="label">Extent</span>
            <span v-text="selectedBookmark.extent.join(', ')" />
          </div>
        </div>

        <MapPreview
          :project="project"
          :settings="settings"
          :extent="selectedBookmark.extent"
        />

        <TextEditor
          class="filled code"
          label="Content"
          v-model="activeBookmarkSettings.content"
          multiline
        />
      </div>
      <span v-else class="f-col-ac f-justify-center empty-message">
        Select bookmark from sidebar
      </span>
    </div>
  </div>
</template>

<script>
import TextEditor from '@/components/TextEditor.vue'
import MapPreview from '@/components/MapPreview.vue'
import { set } from 'vue'

export default {
  name: 'BookmarksEditor',
  components: {
    TextEditor,
    MapPreview,
  },
  props: {
    layers: Array,
    settings: Object,
    project: Object,
  },
  setup() {
    return { defaultGroupName: 'default' }
  },
  data() {
    return {
      selectedBookmark: null,
      selectedBookmarkSettings: null,
      collapsed: [],
      activeExtentEdit: !false,
    }
  },
  computed: {
    bookmarks() {
      return Object.values(this.project.meta.bookmarks?.['default'])
    },
    activeBookmarkSettings() {
      return this.selectedBookmarkSettings
    },
  },
  methods: {
    selectBookmark(item, index) {
      this.selectedBookmark = item
      if (!(item.group in this.settings.bookmarks)) {
        set(this.settings.bookmarks, item.group, {})
      }
      if (!(item.id in this.settings.bookmarks[item.group])) {
        set(this.settings.bookmarks[item.group], item.id, {})
      }
      this.selectedBookmarkSettings =
        this.settings.bookmarks[item.group][item.id]
    },
  },
}
</script>

<style lang="scss" scoped>
@import '@/card.scss';
@import '@/info-grid.scss';

.bookmarks {
  min-height: 0;
  height: 100%;
  flex-shrink: 1;
  overflow: auto;
}
.group-title {
  background-color: #eee;
  font-weight: bold;
}

.bookmarks {
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
