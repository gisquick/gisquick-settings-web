import mapValues from 'lodash/mapValues'
import pickBy from 'lodash/pickBy'

import { hasAny, pull } from '@/utils/collections'
import { layersGroups } from '@/utils/layers'


export function initLayersPermissions (layers) {
  return {
    layers: mapValues(layers, () => []),
    attributes: mapValues(
      pickBy(layers, l => l.attributes),
      l => ({
        ...Object.fromEntries(l.attributes.map(a => [a.name, []])),
        geometry: []
      })
    )
  }
}

export function validateSettings (settings, meta) {
  // detection of media folders
  // const s = new Set()
  // Object.entries(settings.layers).filter(([lid, lset]) => lset.attributes).forEach(([lid, lset]) => {
  //   Object.values(lset.attributes).filter(a => a.widget === 'MediaImage').forEach(a => {
  //     const mediaFolder = a.config?.directory || `web/${meta.layers[lid].name}`
  //     s.add(mediaFolder)
  //   })
  // })
  const layersAttrsNames = mapValues(meta.layers, l => l.attributes?.map(a => a.name))
  settings.auth.roles?.forEach(role => {
    // remove obsole layers/attributes permissions
    Object.keys(role.permissions.layers)
      .filter(lid => !meta.layers[lid])
      .forEach(lid => {
        delete role.permissions.layers[lid]
        delete role.permissions.attributes[lid]
      })
    // initialize missing layers/attributes permissions
    const newLayers = pickBy(meta.layers, (_, lid) => !role.permissions.layers[lid])
    const newPerms = initLayersPermissions(newLayers)
    Object.keys(newLayers).forEach(lid => {
      role.permissions.layers[lid] = newPerms.layers[lid]
      if (newPerms.attributes[lid]) {
        role.permissions.attributes[lid] = newPerms.attributes[lid]
      }
    })
    const attrsPerms = role.permissions.attributes
    Object.entries(attrsPerms).forEach(([layerId, perms]) => {
      layersAttrsNames[layerId]?.filter(name => !perms[name]).forEach(name => {
        perms[name] = []
      })
      if (!perms.geometry) {
        perms.geometry = []
        // const layerPerms = role.permissions.layers[layerId]
        // const layerEditable = layerPerms.includes('query') && hasAny(layerPerms, 'update', 'insert', 'delete')
        // perms.geometry = layerEditable ? ['edit'] : []
      }
    })
  })

  settings.layers = pickBy(settings.layers, (_, lid) => meta.layers[lid])
  Object.entries(settings.layers).filter(([_, lset]) => lset.export_fields).forEach(([lid, lset]) => {
    const attrs = meta.layers[lid]?.attributes?.map(a => a.name)
    pull(lset.export_fields, ...lset.export_fields.filter(name => !attrs.includes(name)))
  })

  // fix fields_order layer settings
  Object.entries(settings.layers).filter(([_, lset]) => lset.fields_order).forEach(([lid, lset]) => {
    const attrs = meta.layers[lid]?.attributes?.map(a => a.name)
    for (const [k, v] of Object.entries(lset.fields_order)) {
      // remove non existing fields
      pull(v, ...v.filter(name => !attrs.includes(name)))
      // add missing fields
      attrs.filter(name => !v.includes(name)).forEach(name => v.push(name))
    }
  })

  // convert old MediaImage widget to the bew MediaFile
  Object.entries(settings.layers).filter(([_, lset]) => lset.attributes).forEach(([_, lset]) => {
    Object.values(lset.attributes).filter(a => a.widget === 'MediaImage').forEach(a => {
      a.widget = 'MediaFile'
      a.config = {...a.config, accept: ['image/*'] }
    })
  })

  // initialize missing layers settings
  Object.keys(meta.layers).filter(lid => !settings.layers[lid]).forEach(lid => {
    settings.layers[lid] = { flags: [...meta.layers[lid].flags] }
  })

  // keep only relevant groups settings
  if (settings.groups) {
    const metaGroupIds = layersGroups(meta.layers_tree).map(g => g.wms_name)
    settings.groups = pickBy(settings.groups, (_, gid) => metaGroupIds.includes(gid))
  }

  // temporary
  settings.topics?.filter(t => !t.id).forEach(t => {
    t.id = t.title.toLowerCase().replace(/ /, '_')
  })
  return settings
}
