<template>
  <div class="page-content light">
    <ScrollArea>
      <div>
        <h2 class="subheader px-2">Project settings</h2>

        <v-select
          class="filled"
          label="Language"
          v-model="settings.lang"
          :items="availableLanguages"
          itemValue="code"
          itemText="title"
        />
      </div>
    </ScrollArea>
  </div>
</template>

<script>
import ScrollArea from '@/ui/ScrollArea.vue'

export default {
  components: { ScrollArea },
  props: {
    project: Object,
    settings: Object,
  },
  setup() {
    return {
      availableLanguages: [
        {
          id: 'en',
          code: 'en-us',
          title: 'English',
        },
        {
          id: 'cs',
          code: 'cs-cz',
          title: 'Czech',
        },
        {
          id: 'sk',
          code: 'sk-sk',
          title: 'Slovak',
        },
      ],
    }
  },
}
</script>
