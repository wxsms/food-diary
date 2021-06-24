import { DateTime } from 'luxon'

export const FORMATS = {
  Y_MM_DD_SIMPLE: 'yyyy-LL-dd',
  Y_M_D_SIMPLE: 'yyyy-L-d',
  Y_M_SIMPLE: 'yyyy-L',
  Y_SIMPLE: 'yyyy',
  Y_M_D: 'yyyy年L月d日',
  Y_M: 'yyyy年L月',
  M_D: 'L月d日'
}

const WEEK_DAYS = {
  '1': '星期一',
  '2': '星期二',
  '3': '星期三',
  '4': '星期四',
  '5': '星期五',
  '6': '星期六',
  '7': '星期日'
}

function _DateTime (ts) {
  const isDateTime = ts instanceof DateTime
  return isDateTime ? ts : DateTime.fromMillis(ts)
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

export function addWeek (ts, number = 1) {
  return _DateTime(ts).plus({ weeks: number })
}

export function addMonth (ts, number = 1) {
  return _DateTime(ts).plus({ months: number })
}

export function minusMonth (ts, number = 1) {
  return _DateTime(ts).minus({ months: number })
}

export function startOfDay (ts) {
  return _DateTime(ts).startOf('day')
}

export function startOfMonth (ts) {
  return _DateTime(ts).startOf('month')
}

export function endOfMonth (ts) {
  return _DateTime(ts).endOf('month')
}

export function startOfYear (ts) {
  return _DateTime(ts).startOf('year')
}

export function endOfYear (ts) {
  return _DateTime(ts).endOf('year')
}

export function getWeekdayLong (ts) {
  return WEEK_DAYS[_DateTime(ts).weekday.toString()]
}

export function getWeekday (ts) {
  return _DateTime(ts).weekday
}

export function diffWeeks (dt1, dt2) {
  return Math.round(Math.abs(_DateTime(dt1).diff(_DateTime(dt2)).as('week')))
}
