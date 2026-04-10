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
    remote: {
      type: cfg.remote?.type || '',
      execute_url: cfg.remote?.execute_url || '',
      method: cfg.remote?.method || '',
      status_url: cfg.remote?.status_url || '',
      result_url: cfg.remote?.result_url || '',
      headers: objToKvPairs(cfg.remote?.headers || {})
    },
  }
}

export function editToProcess (proc) {
  const result = {}

  const remote = {}
  if (proc.remote.type) remote.type = proc.remote.type
  if (proc.remote.execute_url) remote.execute_url = proc.remote.execute_url
  if (proc.remote.method) remote.method = proc.remote.method
  if (proc.remote.status_url) remote.status_url = proc.remote.status_url
  if (proc.remote.result_url) remote.result_url = proc.remote.result_url
  const headers = kvPairsToObj(proc.remote.headers)
  if (Object.keys(headers).length) remote.headers = headers
  if (Object.keys(remote).length) result.remote = remote

  return result
}

export function serviceToEdit (svc) {
  const _processes = Object.entries(svc.processes || {}).map(([id, cfg]) => processToEdit(id, cfg))
  return {
    id: svc.id,
    url: svc.url || '',
    type: svc.type || 'ogcapi-processes',
    name: svc.name || '',
    _processes
  }
}

export function editToService (edit) {
  const result = { url: edit.url, type: edit.type }
  if (edit.name) result.name = edit.name
  const processes = {}
  for (const proc of edit._processes) {
    if (!proc._key) continue
    processes[proc._key] = editToProcess(proc)
  }
  if (Object.keys(processes).length) result.processes = processes
  return result
}
