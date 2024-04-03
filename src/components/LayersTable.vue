<script lang="jsx">
import _xor from 'lodash/xor'
import mapValues from 'lodash/mapValues'

import { layersGroups, filterLayers, layersList } from '@/utils/layers'
import { sanitize, escapeRegExp, removeDiacritics } from '@/ui/utils/text'


const VectorIcons = {
  NoGeometry: 'attribute-table2',
  Point: 'point',
  PointZ: 'point',
  MultiPoint: 'point',
  MultiPointZ: 'point',
  LineString: 'line',
  LineStringZ: 'line',
  MultiLineString: 'line',
  MultiLineStringZ: 'line',
  Polygon: 'polygon',
  PolygonZ: 'polygon',
  MultiPolygon: 'polygon',
  MultiPolygonZ: 'polygon'
}
function layerIcon2 (layer) {
  if (layer.type === 'VectorLayer') {
    return VectorIcons[layer.options.wkb_type]
  } else if (layer.type === 'RasterLayer') {
    return 'raster'
  }
  return ''
}

/* Filter that test/match also groups */
export function filterLayers2(items, test) {
  const list = []
  items.forEach(item => {
    if (item.layers) {
      if (test(item)) {
        list.push(item)
      } else {
        const children = filterLayers2(item.layers, test)
        if (children.length) {
          list.push({
            ...item,
            layers: children
          })
        }
      }
    } else if (test(item)) {
      list.push(item)
    }
  })
  return list
}

function _highlight (orig, search, re) {
  const m = re.exec(search)
  if (m) {
    const s = m.index
    const e = s + m[0].length
    return orig.substring(0, s) + `<strong>${orig.substring(s, e)}</strong>` + _highlight(orig.substring(e), search.substring(e), re)
  }
  return orig
}

export function highlight (text, query) {
  text = sanitize(text)
  if (query.length === 0) {
    return text
  }
  const searchText = sanitize(removeDiacritics(text))
  const re = new RegExp(escapeRegExp(removeDiacritics(query)), 'i')
  return _highlight(text, searchText, re)
}

const CellAlignCls = {
  left: 'f-justify-start',
  center: 'f-justify-center',
  right: 'f-justify-end'
}

export default {
  name: 'LayersTable',
  props: {
    label: String,
    items: Array,
    columns: Array,
    opened: Array,
    collapsed: Array,
    detail: String,
    selected: [Object, String],
    selectedClass: {
      type: String,
      default: 'selected'
    },
    classes: Object,
    labelRenderData: Object
  },
  data () {
    return {
      filter: ''
    }
  },
  computed: {
    displayedItems () {
      if (this.filter) {
        const regex = new RegExp(escapeRegExp(sanitize(removeDiacritics(this.filter))), 'i')
        return filterLayers(this.items, l => regex.test(removeDiacritics(l.title)) || regex.test(removeDiacritics(l.name)))
      }
      return this.items
    },
    highlights () {
      const data = {}
      if (this.filter.length > 0) {
        layersList(this.displayedItems).forEach(l => {
          data[l.id] = highlight(l.title, this.filter)
        })
      }
      return data
    },
    groups () {
      return layersGroups(this.items)
    }
  },
  methods: {
    leafKey (item) {
      return item.id
    },
    groupKey (item) {
      return item.name
    },
    toggleGroup (group) {
      if (this.collapsed) {
        this.$emit('update:collapsed', _xor(this.collapsed, [group.name]))
      } else {
        this.$emit('update:opened', _xor(this.opened, [group.name]))
      }
    },
    expandAll () {
      const model = this.collapsed ?? this.opened
      const evt = this.collapsed ? 'update:collapsed' : 'update:opened'
      const val = (this.collapsed && model.length === 0) || (!this.collapsed && model.length < this.groups.length) ? this.groups.map(g => g.name) : []
      this.$emit(evt, val)
    },
    itemBoundRenderData (item) {
      if (this.labelRenderData?.on) {
        return {
          ...this.labelRenderData,
          on: mapValues(this.labelRenderData.on, l => e => l(e, item))
        }
      }
      return this.labelRenderData
    },
    renderLayerRow (item, group, depth) {
      let cmp
      const indentStyle = {
        paddingLeft: `${30 * depth}px`
      }
      if (this.$scopedSlots.leaf) {
        cmp = this.$scopedSlots.leaf({ item, group, depth })
        cmp[0].data.style = indentStyle

        // v2
        // const slotContent = this.$scopedSlots.leaf({ item, depth })
        // cmp = (
        //   <div
        //     class="f-row-ac"
        //     style={indentStyle}
        //   >
        //     {slotContent}
        //   </div>
        // )
      } else {
        const htmlLabel = this.filter && this.highlights[item.id]
        const label = htmlLabel
          ? <span class="single-line" title={item.name} domPropsInnerHTML={htmlLabel}/>
          : <span class="single-line" title={item.name}>{item.title}</span>
        const icon = layerIcon2(item) || 'unknown'
        cmp = (
          <div
            class="title f-row-ac f-shrink"
            style={indentStyle}
            onClick={() => this.$emit('click:row', item)}
            {...this.itemBoundRenderData(item)}
          >
            <v-icon name={icon} size="24" class="mr-2"/>
            {label}
          </div>
        )
      }

      const values = this.columns.map(column => {
        const slot = this.$scopedSlots[`leaf.${column.value}`]
        // v1 - without wrapping flexbox element
        // const comp = slot ? slot({ item, depth }) : <div class="f-row-ac">{item[column.value]}</div>
        // v2 - with wrapping flexbox element for nice height animation
        const innerContent = slot ? slot({ item, depth }) : <span>{item[column.value]}</span>
        const wrapperCls = ['f-row-ac', CellAlignCls[column.align]]
        const comp = <div class={wrapperCls}>{innerContent}</div>
        return <td class={column.tdClass}>{comp}</td>
      })
      let classes = this.classes?.[item.id]
      if (this.leafKey(item) === this.selected) {
        classes = [classes, 'selected']
      }
      return (
        <tr key={item.id} class={classes}>
          <td class="title">{cmp}</td>
          {values}
        </tr>
      )
    },
    // renderLayerAttributesDetail (layer, depth) {
    //   const indentStyle = {
    //     paddingLeft: `${30 * depth}px`
    //   }
    //   const slot = this.$scopedSlots['detail']
    //   const attrsContent = layer.attributes.map(attr => {
    //     const detail = slot({ layer, attr })
    //     return (
    //       <tr key={`${layer.id}:${attr.name}`} class="detail">
    //         <td>
    //           <div style={indentStyle} class="f-row-ac">{ attr.alias || attr.name }</div>
    //         </td>
    //         {detail}
    //       </tr>
    //   )})
    //   return attrsContent
    // },
    renderLayerDetail (layer, depth) {
      const indentStyle = {
        paddingLeft: `${30 * depth}px`
      }
      const slot = this.$scopedSlots['detail']
      return slot({ layer, indentStyle })
    },
    renderGroupContent (group, depth) {
      const children = group.layers.map(item => item.layers ? this.renderGroup(item, depth) : this.renderLayerRow(item, group, depth))
      if (this.detail) {
        const index = group.layers.findIndex(l => l.id === this.detail)
        if (index !== -1) {
          children.splice(index + 1, 0, ...this.renderLayerDetail(group.layers[index], depth + 1))
        }
      }
      return children
    },
    renderGroup (group, depth) {
      // const open = this.expanded?.includes(group.name)
      const open = this.collapsed
        ? !this.collapsed.includes(group.name)
        : this.opened?.includes(group.name) ?? false

      const groupIcon = open ? 'folder-open' : 'folder'
      const children = open ? this.renderGroupContent(group, depth + 1) : []
      const paddingStyle = {
        paddingLeft: `${30 * depth}px`,
      }
      const groupColumns = this.columns.map(column => {
        const slot = this.$scopedSlots[`group.${column.value}`]
        let content
        if (slot) {
          const innerContent = slot({ group, depth })
          const wrapperCls = ['f-row-ac', CellAlignCls[column.align]]
          content = <div class={wrapperCls}>{innerContent}</div>
        } else {
          content = <span/>
        }
        return <td class={column.tdClass}>{content}</td>
      })
      const groupNode = (
        <tr key={group.name} class={['group', {[this.selectedClass]: this.groupKey(group) === this.selected}]}>
          <td
            onClick={() => this.$emit('click:row', group)}
            key={group.name}
          >
            <div class="f-row-ac" style={paddingStyle} {...this.itemBoundRenderData(group)}>
              <v-icon
                class="mr-2"
                size="20"
                name={groupIcon}
                role="button"
                vOn:click_stop={() => this.toggleGroup(group)}
              />
              <span>{group.name}</span>
            </div>
          </td>
          {...groupColumns}
        </tr>
      )
      return [groupNode, ...children]
    },
    renderLayersHeader () {
      const slot = this.$scopedSlots['header.layer']
      return (
        <th class="header">
          <div class="f-row-ac">
            <v-btn class="icon flat mx-0" onClick={this.expandAll}>
              <v-icon name="folder-open"/>
            </v-btn>
            <span class="mx-2">{this.label}</span>
            <span class="spacer"/>
            <v-text-field
              placeholder="Filter"
              class="filter filled my-0 mx-2"
              rounded={true}
              clearable={true}
              hide-details={true}
              value={this.filter}
              onInput={v => this.filter = v}
              scopedSlots={{
                append: () => <v-icon name="search" class="mx-2"/>
              }}
            />
            {slot?.()}
          </div>
        </th>
      )
    },
    renderHeaderColumn (column) {
      const slot = this.$scopedSlots[`header.${column.value}`]
      if (slot) {
        return slot(column)
      }
      const data = { attrs: column.header }
      const align = column.header?.align || column.align || 'left'
      return <th class={`header text-${align}`} {...data}>{column.text}</th>
    }
  },
  render () {
    const layers = this.displayedItems
    const children = this.renderGroupContent({ layers }, 0)
    // const children = layers.map(item => item.layers ? this.renderGroup(item, 0) : this.renderLayerRow(item, 0))
    const headers = [
      this.renderLayersHeader(),
      ...this.columns.map(col => this.renderHeaderColumn(col))
      // ...this.columns.map(header => <th class={`header text-${header.align || 'center'}`} width="1">{header.text}</th>)
    ]
    return (
      <div class="layers-table">
        <table>
          <thead>
            <tr>{headers}</tr>
          </thead>
          <transition-group name="list" tag="tbody">
            {children}
          </transition-group>
        </table>
      </div>
    )
  }
}
</script>

<style lang="scss">
.list-enter-active, .list-leave-active {
  transition: all 0.35s;
  td {
    transition: all 0.35s;
    overflow: hidden;
    position: relative;
    > * {
      height: inherit;
    }
  }
}
.list-enter, .list-leave-to {
  opacity: 0;
  transform: translate3d(-6px, 0, 0);
  td {
    height: 0!important;
  }
}
</style>
<style lang="scss" scoped>
.layers-table {
  // display: flex;
  // overflow: auto;
  // flex: 1 1;
  position: relative;
  table {
    min-width: 0;
    max-width: 100%;
    // word-break: keep-all;
    // word-break: break-word;
    // flex: 0 0 100%;
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    // table-layout: fixed;
  }
  :deep(th), :deep(td) {
    padding: 0 12px;
    // white-space: nowrap;
  }
  th {
    .filter {
      max-width: 320px;
      text-align: left;
    }
  }
  :deep(td) {
    height: 32px;
    strong {
      color: var(--color-primary);
      background-color: #faf6c4;
    }
    .title {
      // min-width: 200px;
      // --icon-color: var(--color-red);
      --icon-color: var(--status-color, var(--color-primary));
      color: var(--status-color, var(--color-primary));
      // font-weight: 500;
    }
    .single-line {
      min-width: 0;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: pre-wrap;
      word-break: break-all;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
    }
  }
  .icon {
    &[role="button"] {
      cursor: pointer;
    }
  }
  .header {
    background-color: #eee;
    padding-top: 4px;
    padding-bottom: 4px;
    border-top: 1px solid #ddd;
    border-bottom: 1px solid #ddd;
    font-weight: 500;
    // opacity: 0.75;
    font-size: 14px;
    position: sticky;
    top: 0;
    z-index: 1;
    // box-sizing: border-box;
  }
  .group {
    td {
      user-select: none;
      height: 32px;
      // font-weight: 500;
      // line-height: 28px;
      font-style: italic;
    }
    // --icon-color: #777;
    // color: #777;
    &:not(:hover):not(.selected) {
      background-color: #f5f5f5;
    }
    // border-block: 1px solid #eee;
  }
  :deep(tbody) {
    tr:hover {
      background-color: #eee;
    }
    tr.selected {
      background-color: rgba(var(--color-yellow-rgb), 0.5);
    }
  }
}
</style>
