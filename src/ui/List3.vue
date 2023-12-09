<template>
  <!-- <div
    class="list"
    :aria-disabled="disabled"
    :disabled="disabled"
    :tabindex="disabled ? -1 : 0"
  > -->
  <input-field
    class="list"
    :class="{focused}"
    :color="color"
    :focus="focusComponent"
    :error="error"
    :label="label"
    :aria-disabled="disabled"
    :disabled="disabled"
    :tabindex="disabled ? -1 : 0"
  >
    <document-listener
      v-if="focused"
      :key="_uid"
      src="list"
      @click="onDocumentClick"
      @keydown.up.prevent="highlight(highlightIndex - 1)"
      @keydown.down.prevent="highlight(highlightIndex + 1)"
      @keydown.home.prevent="highlight(0)"
      @keydown.end.prevent="highlight(items.length)"
    />
    <slot name="prepend"/>
    <div
      v-if="items && items.length"
      key="items"
      tabindex="-1"
      role="listbox"
      class="list-items"
      :style="colorVars"
      @mouseout="highlightIndex = -1"
    >
      <template v-for="(item, index) in renderItems">
        <div
          :key="index"
          ref="item"
          class="item"
          role="option"
          :class="{
            selected: selectedItem === item,
            highlighted: highlightIndex === index
          }"
          @click="onItemClick(item, index)"
          @mouseover="highlightIndex = index"
        >
          <slot v-if="item === appendItem" name="append-item"/>
          <slot
            v-else
            name="item"
            :item="item"
            :index="index"
          >
            <span v-text="item[itemText]"/>
          </slot>
        </div>
      </template>
    </div>
    <slot v-else name="empty">
      <div v-if="emptyText" class="empty" v-text="emptyText"/>
    </slot>
    <slot name="append"/>
  <!-- </div> -->
  </input-field>
</template>

<script>
import clamp from 'lodash/clamp'
import { colorVars } from './utils/colors'
import InputField from './InputField.vue'
import DocumentListener from './DocumentListener'
import Focusable from './mixins/Focusable'

export default {
  components: { DocumentListener, InputField },
  mixins: [ Focusable ],
  props: {
    error: String,
    color: {
      type: String,
      default: 'primary'
    },
    disabled: Boolean,
    items: Array,
    itemKey: String,
    itemText: String,
    label: String,
    selected: {},
    emptyText: String
  },
  data () {
    return {
      highlightIndex: -1
    }
  },
  computed: {
    colorVars () {
      return this.color && colorVars(this.color)
    },
    renderItems () {
      return this.items || []
    },
    appendItem () {
      return this.$scopedSlots['append-item'] && {}
    },
    selectedItem () {
      if (this.itemKey) {
        return this.renderItems?.find(i => i[this.itemKey] === this.selected)
      }
      return Number.isInteger(this.selected) ? this.renderItems[this.selected] : null
    }
  },
  methods: {
    highlight (index) {
      this.highlightIndex = clamp(index, 0, this.renderItems.length - 1)
      const el = this.$refs.item && this.$refs.item[this.highlightIndex]
      el && el.scrollIntoView({ block: 'nearest' })
    },
    focusComponent () {
      if (!this.disabled) {
        // this.$el.querySelector('[tabindex]').focus()
        // this.$refs.list.focus()
      }
    },
    onItemClick (item, index) {
      this.$emit('click-item', item, index)
    },
    onClick (e) {
      if (!this.disabled) {
        this.focusComponent()
        this.$emit('click', e)
      }
    },
    onDocumentClick (e) {
      if (e.clientX < 0 || e.clientY < 0 || e.clientY > window.innerHeight) {
        return // outside of page, ignore (mouse drag with release/mouseup outside)
      }
      if (!this.$refs.list?.contains(e.target)) {
        // this.focused = false
      } else {
        // this.$emit('click:in', e)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.list {
  display: flex;
  flex-direction: column;
  // border: 1px solid var(--border-color);

  outline: none;

  --select-color: rgba(17, 17, 17, 0.05);
  .list-items {
    outline: none;
    flex-grow: 1;
    overflow: auto;
  }
  &:not(.flat) {
    ::v-deep label {
      margin-bottom: 2px;
    }
     .empty, .list-items {
      border: 1px solid var(--border-color, #ddd);
    }
  }
  .item {
    padding: 0 6px;
    min-height: 36px;
    display: flex;
    align-items: center;
    cursor: pointer;
    outline: none;
    text-decoration: none;
    // font-weight: bold;
    color: inherit;

    transition: all .2s cubic-bezier(.25,.8,.25,1);
    &.selected {
      color: var(--color);
      --icon-color: var(--color);
      background-color: var(--select-color);
      // font-weight: 500;
    }
    &.highlighted {
      // background-color: #eee;
      background-color: var(--highlight-color);
    }
    &:not(:first-child):not(.highlighted) {
      border-top-color: rgba(#D3D3D3, 0.25);
    }
  }
  .empty {
    flex-grow: 1;
    padding: 6px;
    opacity: 0.6;
    font-size: 13px;
    font-weight: 500;
    text-transform: uppercase;
    text-align: center;
  }
  &.flat {
    .empty {
      padding: 6px 0;
    }
  }
}
</style>
