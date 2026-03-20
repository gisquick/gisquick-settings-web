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
    execution: {
      async: cfg.execution?.async || false,
      poll_interval_seconds: cfg.execution?.poll_interval_seconds != null
        ? String(cfg.execution.poll_interval_seconds)
        : '',
      timeout_seconds: cfg.execution?.timeout_seconds != null
        ? String(cfg.execution.timeout_seconds)
        : ''
    },
    project_inputs: (cfg.project_inputs || []).map(inp => ({
      input_id: inp.input_id || '',
      _type: inp.layer !== undefined ? 'layer' : 'value',
      layer: inp.layer || '',
      selection_mode: inp.selection?.mode || '',
      selection_expression: inp.selection?.expression || '',
      encoding_format: inp.encoding?.format || '',
      encoding_geometry_only: inp.encoding?.geometry_only || false,
      value_str: inp.value !== undefined ? JSON.stringify(inp.value) : ''
    })),
    payload_bindings: objToKvPairs(cfg.payload_bindings || {})
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

  const execution = { async: proc.execution.async }
  const poll = proc.execution.poll_interval_seconds
  if (poll !== '' && poll != null) execution.poll_interval_seconds = Number(poll)
  const timeout = proc.execution.timeout_seconds
  if (timeout !== '' && timeout != null) execution.timeout_seconds = Number(timeout)
  result.execution = execution

  const project_inputs = proc.project_inputs
    .filter(inp => inp.input_id)
    .map(inp => {
      const item = { input_id: inp.input_id }
      if (inp._type === 'layer') {
        item.layer = inp.layer
        if (inp.selection_mode || inp.selection_expression) {
          item.selection = {}
          if (inp.selection_mode) item.selection.mode = inp.selection_mode
          if (inp.selection_expression) item.selection.expression = inp.selection_expression
        }
        if (inp.encoding_format || inp.encoding_geometry_only) {
          item.encoding = {}
          if (inp.encoding_format) item.encoding.format = inp.encoding_format
          item.encoding.geometry_only = inp.encoding_geometry_only
        }
      } else {
        try {
          item.value = JSON.parse(inp.value_str)
        } catch {
          item.value = inp.value_str
        }
      }
      return item
    })
  if (project_inputs.length) result.project_inputs = project_inputs

  const payload_bindings = kvPairsToObj(proc.payload_bindings)
  if (Object.keys(payload_bindings).length) result.payload_bindings = payload_bindings

  return result
}

export function serviceToEdit (svc) {
  const _processes = Object.entries(svc.processes || {}).map(([id, cfg]) => processToEdit(id, cfg))
  return {
    url: svc.url || '',
    type: svc.type || 'ogc_api_processes',
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
