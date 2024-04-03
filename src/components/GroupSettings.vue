<template>
  <div class="group-settings f-row-ac">
    <v-btn
      class="icon flat"
      :color="collapsed ? '' : 'primary'"
      @click="setProperty('collapsed', !collapsed)"
    >
      <v-icon :name="collapsed ? 'folder' : 'folder-open'"/>
      <v-tooltip slot="tooltip">Initial state ({{ collapsed ? 'Collapsed' : 'Expanded' }})</v-tooltip>
      <!-- <v-tooltip slot="tooltip">Collapsed/Expanded</v-tooltip> -->
    </v-btn>
    <v-btn
      class="icon flat"
      :color="virtualLayer ? 'primary' : ''"
      @click="setProperty('virtual_layer', !virtualLayer)"
    >
      <v-icon name="layers"/>
      <v-tooltip slot="tooltip">Virtual Layer</v-tooltip>
    </v-btn>
  </div>
</template>

<script>
export default {
  props: {
    value: Object,
    menu: Boolean
  },
  computed: {
    collapsed () {
      return this.value?.collapsed
    },
    virtualLayer () {
      return this.value?.virtual_layer
    }
  },
  methods: {
    setProperty (name, val) {
      const value = { ...this.value, [name]: val }
      this.$emit('input', value)
    }
  }
}
</script>

<style lang="scss" scoped>
.group-settings {
  --gutter: 3px;
}
</style>
