
export function formatRelativeTime(unixSeconds: number, now: number = Date.now()): string {
  const target = unixSeconds * 1000
  const diff = now - target


  if (diff < 0) return formatAbsolute(target)

  const sec = Math.floor(diff / 1000)
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)

  if (sec < 60) return '刚刚'
  if (min < 60) return `${min} 分钟前`
  if (hour < 24 && !isYesterday(target, now) && isSameDay(target, now)) {
    return `${hour} 小时前`
  }


  if (isSameDay(target, now)) return `今天 ${fmtTime(target)}`
  if (isYesterday(target, now)) return `昨天 ${fmtTime(target)}`
  return formatAbsolute(target)
}

function isSameDay(a: number, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString()
}

function isYesterday(target: number, now: number): boolean {
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  return new Date(target).toDateString() === yesterday.toDateString()
}

function fmtTime(ms: number): string {
  const d = new Date(ms)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function formatAbsolute(ms: number): string {
  const d = new Date(ms)
  const Y = d.getFullYear()
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  return `${Y}-${M}-${D} ${fmtTime(ms)}`
}
