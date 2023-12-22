<template>
  <topics-editor :layers="overlays"/>
</template>

<script>
import TopicsEditor from '@/components/TopicsEditor.vue'
import { filterLayers, transformLayersTree } from '@/utils/layers'

export default {
  components: { TopicsEditor },
  inject: ['project', 'settings'],
  computed: {
    overlays () {
      const meta = this.project.meta
      let tree = meta.layers_tree
      tree = filterLayers(tree, l => !this.settings.layers[l.id]?.flags?.includes('excluded'))
      return transformLayersTree(
        tree,
        l => ({ ...meta.layers[l.id] }),
        (g, layers) => ({ ...g, layers })
      )
    }
  }
}
</script>

<style lang="scss" scoped>
.topics {
  min-height: 0;
  height: 100%;
  flex-shrink: 1;
  overflow: auto;
}
</style>
