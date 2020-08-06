import { DateTime } from 'luxon'

export const FORMATS = {
  Y_M_D: 'yyyy年L月d日',
  Y_M: 'yyyy年L月',
  M_D: 'L月d日'
}

function _DateTime (ts) {
  return ts instanceof DateTime ? ts : DateTime.fromMillis(ts)
}

export function format (ts, format = FORMATS.Y_M_D) {
  return _DateTime(ts).toFormat(format)
}

export function addDay (ts, number = 1) {
  return _DateTime(ts).plus({ days: number })
}

export function minusDay (ts, number = 1) {
  return _DateTime(ts).minus({ days: number })
}

export function addMonth (ts, number = 1) {
  return _DateTime(ts).plus({ months: number })
}

export function minusMonth (ts, number = 1) {
  return _DateTime(ts).minus({ months: number })
}

export function startOfMonth (ts) {
  return _DateTime(ts).startOf('month')
}

export function endOfMonth (ts) {
  return _DateTime(ts).endOf('month')
}

export function getWeekdayLong (ts) {
  return _DateTime(ts).weekdayLong
}

export function getWeekday (ts) {
  return _DateTime(ts).weekday
}
