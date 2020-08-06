import { DateTime } from 'luxon'

const FORMAT_Y_M_D = 'yyyy年L月d日'
const FORMAT_M_D = 'L月d日'

function _DateTime (ts) {
  return ts instanceof DateTime ? ts : DateTime.fromMillis(ts)
}

export function format (ts, short=false) {
  return _DateTime(ts).toFormat(short ? FORMAT_M_D : FORMAT_Y_M_D)
}

export function addDay (ts, number = 1) {
  return _DateTime(ts).plus({ days: number })
}

export function minusDay (ts, number = 1) {
  return _DateTime(ts).minus({ days: number })
}

export function getWeekdayLong (ts) {
  return _DateTime(ts).weekdayLong
}
