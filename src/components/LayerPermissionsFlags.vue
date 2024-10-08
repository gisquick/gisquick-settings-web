<template>
  <div class="flags f-row-ac">
    <template v-for="flag in flags">
      <div v-if="flag.separator" :key="`sep_${flag.name}`" class="v-separator"/>
      <v-btn
        v-else
        :key="flag.name"
        class="icon flat"
        :color="flag.value ? 'primary' : '#777'"
        :disabled="flag.disabled"
        @click="toggle(flag)"
      >
        <v-icon :name="flag.icon"/>
        <v-tooltip slot="tooltip" align="ll,rr,c;tt,bb" content-class="tooltip dark">
          <span v-text="flag.desc"/>
        </v-tooltip>
      </v-btn>
    </template>
  </div>
</template>

<script>

export default {
  props: {
    capabilities: Object,
    value: Array
  },
  computed: {
    flags () {
      const visible = this.value.includes('view')
      return [
        {
          name: 'view',
          icon: 'visibility',
          desc: 'Layer map visibility',
          disabled: !this.capabilities.view,
          value: visible
        }, {
          name: 'query',
          icon: 'identification',
          desc: 'Enables querying of layer features (identification, attributes table)',
          disabled: !this.capabilities.query,
          value: this.value.includes('query')
        }, {
          name: 'export',
          icon: 'download',
          desc: 'Enables export of layer features (attributes) in text format',
          disabled: !this.capabilities.export,
          value: this.value.includes('export')
        }, {
          separator: true
        }, {
          name: 'update',
          icon: 'pencil',
          desc: 'Enables updating of existing features. Attributes and geometry can be further specified.',
          disabled: !this.capabilities.update,
          value: this.value.includes('update')
        }, {
          name: 'insert',
          icon: 'plus',
          desc: 'Enables inserting of new features',
          disabled: !this.capabilities.insert,
          value: this.value.includes('insert')
        }, {
          name: 'delete',
          icon: 'delete_forever',
          desc: 'Enables deleting of existing features',
          disabled: !this.capabilities.delete,
          value: this.value.includes('delete')
        }
      ]
    }
  },
  methods: {
    toggle (flag) {
      const { name, value } = flag
      this.$emit('change', { flag: name, value: !value })
    }
  }
}
</script>

<style lang="scss" scoped>
.flags {
  .v-btn {
    margin: 0 4px;
  }
}
</style>
