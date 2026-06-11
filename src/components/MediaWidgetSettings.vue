<template>
  <div class="f-col">
    <v-text-field
      lazy
      class="filled"
      label="Directory"
      placeholder="web/<layername>"
      :value="config.directory"
      @input="$emit('update', 'directory', $event)"
    />
    <div class="desc">
      Currently ony <strong>web/*</strong> paths are supported
    </div>
    <v-text-field
      lazy
      class="filled"
      label="Filename"
      placeholder="<timestamp>"
      :value="config.filename"
      @input="$emit('update', 'filename', $event)"
    />
    <div class="desc">
      Special values: <strong v-text="'<timestamp>, <filename>, <hash>, <random>'"/>
    </div>
    <v-select
      label="Store path relative to"
      class="filled"
      :items="relativeDepths"
      :value="config.relative_depth || 0"
      @input="$emit('update', 'relative_depth', $event)"
    >
      <template v-slot:item="{ item }">
        <div class="f-row-ac f-grow">
          <span class="f-grow" v-text="item.text"/>
          <span class="item-desc mx-2" v-text="item.desc"/>
        </div>
      </template>
    </v-select>

    <span class="field-label mx-2 mt-2">File formats</span>
    <div class="f-row-ac">
      <v-radio-btn
        label="Any"
        val="any"
        :value="typeMode"
        @input="$emit('update', 'accept', undefined)"
      />
      <v-radio-btn
        label="Predefined options"
        val="simple"
        :value="typeMode"
        @input="$emit('update', 'accept', [])"
      />
      <v-radio-btn
        label="Custom (flexible)"
        val="custom"
        :value="typeMode"
        @input="$emit('update', 'accept', '')"
      />
    </div>
    <v-select
      v-if="typeMode === 'simple'"
      class="filled"
      placeholder="Choose from predefined options"
      :items="mediaTypes"
      :value="config.accept || []"
      @input="$emit('update', 'accept', $event)"
      multiple
    />
    <template v-else-if="typeMode === 'custom'">
      <v-text-field
        class="filled"
        placeholder="File type specifiers string"
        :value="config.accept"
        @input="$emit('update', 'accept', $event)"
      />
      <span class="desc">
        Identical to
        <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/accept#unique_file_type_specifiers">HTML <strong>accept</strong> attribute</a>
        for restricting allowed file formats.
      </span>
    </template>
    <div class="f-row-ac">
      <v-text-field
        class="filled"
        label="Max size (MB)"
        type="number"
        step="1"
        :value="config.max_size"
        @input="$emit('update', 'max_size', parseFloat($event))"
      />
      <v-text-field
        class="filled"
        label="Max image resolution (megapixels)"
        placeholder="Image resolution"
        type="number"
        step="0.1"
        min="0"
        max="100"
        :value="config.max_resolution"
        @input="$emit('update', 'max_resolution', parseFloat($event))"
      />
    </div>
  </div>
</template>

<script>

export const MediaTypesList = [
  { text: 'Image', value: 'image/*' },
  { text: 'Video', value: 'video/*' },
  { text: 'Audio', value: 'audio/*' },
  { text: 'Pdf', value: '.pdf' },
  { text: 'Doc', value: '.doc' },
  { text: 'XML', value: '.xml' },
]

export default {
  props: {
    config: Object
  },
  computed: {
    typeMode () {
      const val = this.config.accept
      return typeof val === 'string' ? 'custom' : Array.isArray(val) ? 'simple' : 'any'
    },
    mediaTypes () {
      return MediaTypesList
    },
    // relativeDepths () {
    //   const dir = this.config.directory || 'web/<layername>'
    //   const parts = ['', ...dir.trim().split('/').filter(v => v)]
    //   return parts.map((_, i) => ({
    //     text: '/' + parts.slice(1, i + 1).join('/'),
    //     value: i
    //   }))
    // }
    relativeDepths () {
      const dir = this.config.directory || 'web/<layername>'
      // [web, layername] => /web, /web/layername
      const parts = dir.trim().split('/').filter(v => v)
      return [
        { text: '/', desc: "(project's root directory)", value: 0 },
        ...parts.map((_, i) => ({
          text: '/' + parts.slice(0, i + 1).join('/'),
          value: i + 1
        }))
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.desc {
  font-size: 13px;
  opacity: 0.7;
  margin: 0 6px 8px 6px;
}
a[href] {
  color: var(--color-primary);
  opacity: 1;
}
.item-desc {
  color: #909090;
}
.accept {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
}
.accept-field {
  .select > :deep(.input) {
    border: none!important;
  }
}
</style>
