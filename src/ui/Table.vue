<template>
  <!-- <scroll-area class="table-container"> -->
  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th
            v-for="(column, index) in columns"
            :key="column.key"
            role="columnheader"
            :aria-label="column.label"
            :style="headersStyles[index]"
            :class="headersClasses[index]"
          >
            <slot :name="`header(${headersSlots[index]})`" :column="column">
              <div class="f-row-ac" @click="column.sortable && toggleSort(column)">
                <span v-text="labels[index]"/>
                <sort-control
                  v-if="column.sortable"
                  class="ml-2"
                  :sort="sort && sort.sortBy === column.key ? sort.sort : null"
                />
              </div>
            </slot>
          </th>
        </tr>
        <tr class="progress">
          <th :colspan="columns.length">
            <div v-if="loading" class="loading-bar">
              <div class="highlight"/>
            </div>
          </th>
        </tr>
      </thead>
      <tbody v-if="!error && renderItems">
        <template v-for="(item, row) in renderItems">
          <slot
            v-if="item.$slot"
            :name="`row(${item.$slot})`"
            :columns="columns"
            :item="item"
            :row="row"
            :values="values"
            :renderer="cellSlot"
          >
            <tr
              :key="row"
              :class="item.$slot"
            >
              <td :colspan="columns.length">
                <span v-text="item.title"/>
              </td>
            </tr>
          </slot>
          <tr
            v-else
            :key="row"
            :class="{even: row % 2, selected: selectedLookup[item[itemKey]]}"
            @click="$emit('row-click', item, row)"
          >
            <td
              v-for="(col, index) in columns"
              :key="col.key"
              :class="columnsClasses[index]"
            >
              <slot :name="`cell(${col.key})`" v-bind="values[row][col.key]">
                <span v-text="values[row][col.key].value"/>
              </slot>
            </td>
          </tr>

          <tr
            v-if="selectedLookup[item[itemKey]] || closing[item[itemKey]]"
            :key="`detail:${row}`"
            class="detail"
          >
            <td :colspan="columns.length">
              <v-collapsible :appear="appearAnim">
                <slot v-if="selectedLookup[item[itemKey]]" name="item-detail" :item="item" :row="row"/>
              </v-collapsible>
            </td>
          </tr>

        </template>
      </tbody>
    </table>
    <div v-if="error" class="error f-row-ac m-4">
      <v-icon name="warning" class="mr-2"/>
      <span v-text="errorText"/>
    </div>
  </div>
  <!-- </scroll-area> -->
</template>

<script>
import difference from 'lodash/difference'
import SortControl from './SortControl.vue'
import VCollapsible from './Collapsible.vue'

import formats from '@/format'

function toPx (val) {
  return isNaN(val) ? val : `${val}px`
}

function lookupTable (items) {
  return items.reduce((obj, val) => (obj[val] = true, obj), {})
}

export default {
  components: { SortControl, VCollapsible },
  props: {
    /**
     * - key: String
     * - label: String, Array
     * - format: String (data format)
     * - transform: Function (transformation before formatting)
     * - sortable: Boolean
     * - info: String
     * - align: String (left,center,right)
     * - header: Object
     *   - class: String, Object, Array
     *   - align: String
     *   - width: Number
     * - tdClass: String, Object, Array
     * - mapValues: Object (values lookup table)
     */
    columns: Array,
    categorizedItems: Array,
    error: [String, Boolean, Object],
    items: Array,
    itemKey: String,
    colors: {
      type: Array,
      // default: () => ['#00B569', '#EB5E4A', '#E35C7C', '#3E97EF']
      // default: () => ['#ddd', '#888', '#aaa', '#777', '#999']
      default: () => ['#c0c0c0', '#aaa']
    },
    loading: Boolean,
    selected: {
      default: null
    },
    sort: Object
  },
  data () {
    return {
      appearAnim: false,
      closing: {}
    }
  },
  computed: {
    cellSlot () {
      const _this = this
      return {
        functional: true,
        props: {
          column: Object,
          row: Number
        },
        render (h, ctx) {
          const { row, column } = ctx.props
          const slot = _this.$scopedSlots[`cell(${column.key})`]
          const data = _this.values[row][column.key]
          return slot ? slot(data) : h('span', data.value)
        }
      }
    },
    renderItems () {
      if (this.categorizedItems) {
        const items = []
        this.categorizedItems.forEach(cat => {
          items.push({ title: cat.title, $slot: 'subheader' })
          items.push(...cat.items)
        })
        return items
      }
      return this.items
    },
    headersStyles () {
      const size = this.colors.length
      return this.columns.map((v, i) => ({
        borderBottomColor: this.colors[i % size],
        width: toPx(v.header?.width)
      }))
    },
    headersClasses () {
      return this.columns.map(col => {
        const { header } = col
        return [header?.class, header?.align || col.align, { sortable: col.sortable }]
      })
    },
    headersSlots () {
      return this.columns.map(col => col.header?.slot || col.key)
    },
    columnsClasses () {
      return this.columns.map(col => [col.format, col.align, col.tdClass])
    },
    values () {
      return this.renderItems.map(this.itemData)
    },
    labels () {
      return this.columns.map(col => Array.isArray(col.label) ? col.label.join('/\n') : col.label)
    },
    selectedLookup () {
      if (Array.isArray(this.selected)) {
        return lookupTable(this.selected)
      }
      return { [this.selected]: true }
    },
    errorText () {
      return !!this.error && (typeof this.error === 'string' ? this.error : 'Error')
    }
  },
  watch: {
    selected (n, o) {
      if (Array.isArray(o)) {
        this.closing = lookupTable(difference(o, n))
      } else {
        this.closing = { [o]: true }
      }
      setTimeout(() => {
        this.closing = {}
      }, 500)
    }
  },
  mounted () {
    this.appearAnim = true
  },
  methods: {
    keyValue (item, key) {
      // todo: consider to use lodash/get
      const props = key.split('.')
      let value = item[props[0]]
      for (const prop of props.slice(1)) {
        if (!value) {
          break
        }
        value = value[prop]
      }
      return value
    },
    itemData (item, row) {
      if (this.categorizedItems && item.$slot === 'subheader') {
        return null
      }
      const data = {}
      this.columns.forEach(col => {
        let value = this.keyValue(item, col.key)
        if (col.transform) {
          value = col.transform(value)
        }
        if (col.format) {
          value = this.formatValue(value, item, col)
        } else if (col.mapValues) {
          value = col.mapValues[value]
        }
        data[col.key] = { row, item, value }
      })
      return data
    },
    toggleSort (column) {
      if (this.sort && this.sort.sortBy === column.key) {
        const newValue = {
          sortBy: this.sort.sortBy,
          sort: this.sort.sort === 'asc' ? 'desc' : 'asc'
        }
        this.$emit('update:sort', newValue)
      } else {
        this.$emit('update:sort', { sortBy: column.key, sort: 'desc' })
      }
    },
    formatValue (value, item, col) {
      return typeof col.format === 'string' ? formats[col.format](value) : col.format?.(value)
    }
  }
}
</script>

<style lang="scss" scoped>
.light {
  .table-container, &.table-container {
    background-color: #fff;
    tbody {
      tr {
        &.even {
          // background-color: #f7f7f7;
          background-color: #a7a7a711;
        }
        &:not(.detail) td {
          border-top: 1px solid #E0E0E0;
        }
        &.subheader {
          background-color: rgba(48, 79, 125, 0.3);
          font-size: 15px;
          font-weight: 500;
          text-transform: uppercase;
        }
        &:hover {
          background-color: #eee;
          td {
            border-color: #ddd;
            background-color: rgba(0,0,0, 0.04);
          }
        }
        &.selected {
          // background-color: rgba(var(--color-primary-rgb), 0.18);
          background-color: rgba(25, 118, 210, 0.15);
          td {
            border-color: rgba(var(--color-primary-rgb), 0.18);
          }
          & + tr + tr > td {
            border-top: 1px solid rgba(var(--color-primary-rgb), 0.23);
          }
        }
      }
    }
    th, td {
      &:not(:last-child) {
        border-right: 1px solid #f0f0f0;
      }
    }
    th {
      &:not(:last-child) {
        border-right: 1px solid #c0c0c0;
      }
    }
    &.outlined {
      border: 1px solid #bbb;
      table {
        thead {
          border: 1px solid #bbb;
        }
        tbody {
          border: 1px solid #ddd;
        }
      }
    }
  }
}

.table-container {
  max-width: 100%;
  overflow: auto;
  table {
    font-size: 13px;
    border-collapse: separate;
    border-spacing: 0;
    min-width: 100%;
    position: relative;
  }
  thead {
    // text-transform: uppercase;
    // color: var(--color-primary);
    text-align: left;
    th {
      padding: 4px 12px;
      border-bottom: 4px solid;
      height: 36px;
      user-select: none;
      position: relative;
      white-space: nowrap;
      background-color: #dfdfdf;
      /* sticky header */
      position: sticky;
      top: 0;
      z-index: 1;
      &.sortable {
        cursor: pointer;
      }
      &.center > .f-row-ac {
        justify-content: center;
        text-align: center;
      }
      &.right > .f-row-ac {
        justify-content: flex-end;
        text-align: right;
      }
    }
    tr.progress {
      th {
        height: 0;
        padding: 0;
        border: none;
        position: sticky;
        top: 42px;
      }
    }
  }
  tbody {
    display: relative;
    tr {
      &.selected {
        box-shadow: 0 3px 4px rgba(0,0,0,0.1);
        td {
          // background-color: var(--color-primary);
          // background-color: rgba(var(--color-primary-rgb), 0.18);
          // background-color: rgba(25, 118, 210, 0.15);
        }
        td:first-child {
          position: relative;
          &::before {
            content: "";
            position: absolute;
            width: 4px;
            left: 0;
            top: 0;
            bottom: 0;
            background-color: var(--color-primary);
          }
        }
      }
      &.detail {
        // display: flex;
        // overflow: hidden;
        td {
          // display: flex;
          height: auto;
          padding: 0;
        }
      }
    }
    td {
      padding: 2px 12px;
      height: 32px;
      &.right {
        text-align: right;
        > .f-row-ac {
          justify-content: flex-end;
        }
      }
      &.center {
        text-align: center;
        > .f-row-ac {
          justify-content: center;
        }
      }
      img {
        vertical-align: middle;
      }
    }
  }
}
.error {
  color: var(--color-red);
  --icon-color: currentColor;
  font-weight: 500;
}
.loading-bar {
  position: absolute;
  height: 3px;
  left: 0;
  right: 0;
  // background-color: rgba(var(--color-primary-rgb), 0.2);
  margin-top: -4px;
  // z-index: 10;
  // background: linear-gradient(90deg,#ffd33d,#ea4aaa 17%,#b34bff 34%,#01feff 51%,#ffd33d 68%,#ea4aaa 85%,#b34bff);
  // background: linear-gradient(90deg,var(--color-primary),rgba(#ffffff, 0.2), var(--color-primary));
  // background: linear-gradient(90deg,rgba(#ffffff, 0.2), var(--color-primary), rgba(#ffffff, 0.2));
  // animation: 2s linear infinite progress-animation;
  // background-size: 300% 100%;
  overflow: hidden;
  .highlight {
    // animation: 3s cubic-bezier(0.4, 0, 0.2, 1) infinite running-progress;
    // animation: 3s cubic-bezier(0.4, 0, 0.2, 1) infinite slide2;
    // background-color: var(--color-primary);
    position: absolute;
    left: 0;
    right: 0;
    animation: 1s ease infinite progress;
    background: linear-gradient(90deg,rgba(#ffffff, 0.2), var(--color-primary), rgba(#ffffff, 0.2));
    // display: none;
    height: inherit;
  }
}
@keyframes progress-animation {
  0% {
    background-position: -100%;
  }
  100% {
    background-position: 100%;
  }
}
@keyframes progress {
  0% {
    transform: translate(-100%, 0) scale(0.7, 1);
  }
  100% {
    transform: translate(100%, 0) scale(1, 1);
  }
}

@keyframes slide2 {
  0% {
    transform: translate(-100%, 0) scale(0.7, 1);
  }
  100% {
    transform: translate(70%, 0) scale(0, 1);
  }
}

@keyframes slide {
  0% {
    transform: translate(-100%, 0) scale(0.75, 1);
  }
  60% {
    transform: translate(25%, 0) scale(0.35, 1);
  }
  100% {
    transform: translate(100%, 0) scale(1, 1);
  }
}
@keyframes running-progress {
  0% { margin-left: 0px; margin-right: 100%; }
  50% { margin-left: 25%; margin-right: 0%; }
  100% { margin-left: 100%; margin-right: 0; }
}
</style>
