export function objToKvPairs (obj) {
  if (!obj || typeof obj !== 'object') return []
  return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }))
}

export function kvPairsToObj (pairs) {
  const obj = {}
  for (const { key, value } of pairs) {
    if (key) obj[key] = value
  }
  return obj
}

export function processToEdit (id, cfg) {
  return {
    _key: id,
    title: cfg.title || '',
    description: cfg.description || null,
  }
}

export function serviceToEdit (svc) {
  const _processes = Object.entries(svc.processes || {}).map(([id, cfg]) => processToEdit(id, cfg))
  return {
    id: svc.id,
    url: svc.url || '',
    type: svc.type || 'ogcapi-processes',
    name: svc.name || '',
    _headers: objToKvPairs(svc.headers || {}),
    _processes,
  }
}

export function editToService (edit) {
  const result = { url: edit.url, type: edit.type }
  if (edit.name) result.name = edit.name
  const headers = kvPairsToObj(edit._headers || [])
  if (Object.keys(headers).length) result.headers = headers
  const processes = (edit._processes || []).filter(p => p._key).map(p => p._key)
  if (processes.length) result.processes = processes
  return result
}
