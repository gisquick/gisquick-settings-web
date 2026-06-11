import intersection from 'lodash/intersection'

function hasAny (array, ...values) {
  for (const v of values) {
    if (array.includes(v)) {
      return true
    }
  }
  return false
}

export function layerCapabilities1 (meta, settings) {
  const metaFlags = new Set(meta.flags || [])
  const settingsFlags = new Set(settings.flags || [])
  const layerVisible = !settingsFlags.has('excluded') && !settingsFlags.has('hidden')
  const isVectorLayer = meta.type === 'VectorLayer'

  return {
    view: layerVisible,
    identify: layerVisible && metaFlags.has('query'),
    edit: layerVisible && isVectorLayer && hasAny(meta.options.wfs, 'insert', 'update', 'delete'),
    export: layerVisible && isVectorLayer && meta.options.wfs.includes('query') && settingsFlags.has('query')
  }
}

export function layerCapabilities (meta, settings) {
  const layerFlags = intersection(meta.flags, settings.flags)
  // const layerVisible = !settings.flags.includes('excluded') && !settings.flags.includes('hidden')
  const layerVisible = !settings.flags.includes('excluded') // do not exclude hidden layers for possible use in relations
  const isVectorLayer = meta.type === 'VectorLayer'
  // const queryable = layerVisible && layerFlags.includes('query')
  const queryable = layerFlags.includes('query')

  const wfsFlags = isVectorLayer ? meta.options.wfs : null
  const editable = queryable && isVectorLayer && meta.flags.includes('edit') && wfsFlags?.length > 1
  return {
    view: layerVisible,
    // query: layerVisible && meta.flags.includes('query'),
    query: meta.flags.includes('query'),
    export: queryable && wfsFlags?.includes('query'),
    // update: editable || wfsFlags?.includes('update'),
    // insert: editable || wfsFlags?.includes('insert'),
    // delete: editable || wfsFlags?.includes('delete'),
    edit: editable && {
      update: !!wfsFlags?.includes('update'),
      insert: !!wfsFlags?.includes('insert'),
      delete: !!wfsFlags?.includes('delete')
    }
  }
}

/*
export function layerPermissionsCapabilities (pCapabilities, sflags, permFlags) {
  const visible = permFlags.includes('view')
  const queryable = visible && permFlags.includes('query')
  return {
    view: pCapabilities.view,// && visible,
    // view: pCapabilities.view && sflags.includes('view'),// && visible,
    query: pCapabilities.query && visible && sflags.includes('query'),
    export: pCapabilities.export && queryable && sflags.includes('export'),
    edit: pCapabilities.edit && queryable && {
      update: pCapabilities.edit.update && sflags.includes('edit'),
      insert: pCapabilities.edit.insert && sflags.includes('edit'),
      delete: pCapabilities.edit.delete && sflags.includes('edit')
    }
  }
}
*/
// ver. 2
export function layerPermissionsCapabilities (pCapabilities, sflags, permFlags) {
  const queryable = permFlags.includes('query')
  const editable = !!(pCapabilities.edit && queryable)
  return {
    view: pCapabilities.view,// && visible,
    // view: pCapabilities.view && sflags.includes('view'),
    query: pCapabilities.query && sflags.includes('query'),
    export: pCapabilities.export && queryable && sflags.includes('export'),
    update: editable && pCapabilities.edit.update && sflags.includes('edit'),
    insert: editable && pCapabilities.edit.insert && sflags.includes('edit'),
    delete: editable && pCapabilities.edit.delete && sflags.includes('edit'),
    edit: editable
  }
}
