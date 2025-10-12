export function logInfo(event: string, data?: any) {
  console.log(JSON.stringify({ level: 'info', event, data, ts: new Date().toISOString() }))
}

export function logWarn(event: string, data?: any) {
  console.warn(JSON.stringify({ level: 'warn', event, data, ts: new Date().toISOString() }))
}

export function logError(event: string, data?: any) {
  console.error(JSON.stringify({ level: 'error', event, data, ts: new Date().toISOString() }))
}


