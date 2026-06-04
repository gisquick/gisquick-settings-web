<template>
  <v-dialog ref="dialog">
    <slot>
      <div class="content f-row-ac">
        <v-icon :name="icon" size="24"/>
        <slot name="text">
          <span class="mx-2" v-text="text"/>
        </slot>
      </div>
    </slot>
    <!-- <hr class="mx-4 my-2"/> -->
    <div class="actions f-row-ac f-justify-end mx-2">
      <v-btn color="#999" @click="close">No</v-btn>
      <v-btn color="primary" @click="doAction">Yes</v-btn>
    </div>
  </v-dialog>
</template>

<script>
export default {
  props: {
    action: Function,
    icon: {
      type: String,
      default: 'unknown'
    },
    text: String
  },
  methods: {
    close () {
      this.$refs.dialog.close()
    },
    show (data) {
      // this.$refs.dialog.show({ action })
      this.$refs.dialog.show(data)
    },
    doAction () {
      const action = this.data?.action ?? this.action
      action()
      this.close()
    }
  }
}
</script>
<style lang="scss" scoped>
.content {
  font-size: 17px;
  padding: 10px 12px;
  max-width: 540px;
}
.actions {
  .btn {
    min-width: 100px;
    max-height: 32px;
  }
}
</style>