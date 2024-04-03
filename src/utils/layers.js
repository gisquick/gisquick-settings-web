export function layersList (items) {
  const list = []
  items.forEach(item => {
    if (item.layers) {
      list.push(...layersList(item.layers))
    } else {
      list.push(item)
    }
  })
  return list
}

export function filterLayers (items, test) {
  const list = []
  items.forEach(item => {
    if (item.layers) {
      const children = filterLayers(item.layers, test)
      if (children.length) {
        list.push({
          ...item,
          layers: children
        })
      }
    } else if (test(item)) {
      list.push(item)
    }
  })
  return list
}

export function layersGroups (items) {
  const list = []
  items.forEach(item => {
    if (item.layers) {
      list.push(item, ...layersGroups(item.layers))
    }
  })
  return list
}

export function mapLayers (items, fn) {
  return items.map(i => i.layers ? { ...i, layers: mapLayers(i.layers, fn) } : fn(i))
}

function sortLayers (layers) {
  return [
    ...layers.filter(i => !i.layers),
    ...layers.filter(i => i.layers)
  ]
}

export function transformLayersTree (layers, transformLayer, transformGroup) {
  return layers.map(i => {
    if (i.layers) {
      const children = transformLayersTree(i.layers, transformLayer, transformGroup)
      // return transformGroup(i, children)
      return transformGroup(i, sortLayers(children))
    } else {
      return transformLayer(i)
    }
  })
}

export function transformLayersTree2 (tree, transformLayer, transformGroup, gi) {
  return tree.map((n, i) => {
    if (n.layers) {
      const children = transformLayersTree2(n.layers, transformLayer, transformGroup, gi ? [...gi, i] : [i])
      return transformGroup(n, children, gi ? [...gi, i] : [i])
    } else {
      return transformLayer(n.id)
    }
  })
}

const isAlphaNum = RegExp.prototype.test.bind(/[a-zA-Z0-9]/)

export function shortName (layername) {
  const normalized = removeDiacritics(layername).replace(/[^a-z0-9_\-\.]/gmi, ' ').replace(/\s+/g, ' ').trim()
  const parts = normalized.split(' ')
  let name = parts[0]
  parts.slice(1).forEach(p => {
    if (isAlphaNum(name.slice(-1)) && isAlphaNum(p.charAt(0))) {
      name += '_'
    }
    name += p
  })
  return name
}

// const LayerNameRegex = new RegExp('^[a-zA-Z][a-zA-Z0-9_.-]*$')
export const isValidLayerName = RegExp.prototype.test.bind(/^[a-zA-Z][a-zA-Z0-9_.-]*$/)
