<template>
  <div class="page-content light">
    <ScrollArea>
      <div>
        <h2 class="subheader px-2">Project settings</h2>
        <TextEditor
          class="filled"
          label="Project description"
          v-model="settings.description"
          multiline
          lazy
        />
      </div>
    </ScrollArea>
  </div>
</template>

<script>
import ScrollArea from '@/ui/ScrollArea.vue'
import TextEditor from '@/components/TextEditor.vue'

export default {
  components: { ScrollArea, TextEditor },
  props: {
    project: Object,
    settings: Object,
  },
}
</script>

<style lang="scss" scoped>
:deep {
  .text-editor {
    > label {
      order: 0;
    }

    > .input {
      order: 2;
    }

    > .toolbar {
      order: 1;
      top: 0;
      position: sticky;
    }
  }
}
</style>
