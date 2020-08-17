import { STORAGE_KEYS } from '../constants/constants'
import { debug, error } from './log.utils'

export const version = '1.7.1'
const _reviewVersion = { version: null }
const _scdVersion = { version: null }

function _isVersionExist (v) {
  const version = _getVersionValue(v)
  return typeof version === 'string'
}

function _getVersionValue (v) {
  return v.version
}

function _setVersionValue (v, val) {
  v.version = val
}

async function _getVersion (v) {
  if (_isVersionExist(v)) {
    return _getVersionValue(v)
  }
  await getVersions()
  return _getVersionValue(v)
}

async function _localCompare (v, withVal) {
  return _getVersionValue(v) === withVal
}

async function _compare (v, withVal) {
  if (_isVersionExist(v)) {
    return _localCompare(v, withVal)
  }
  await getVersions()
  return _localCompare(v, withVal)
}

async function getVersions () {
  if (_isVersionExist(_reviewVersion) && _isVersionExist(_scdVersion)) {
    return
  }
  const db = wx.cloud.database()
  const { data } = await db.collection('versions').get()
  _setVersionValue(_reviewVersion, data[0].review)
  _setVersionValue(_scdVersion, data[0].scd)
}

export async function isReview () {
  return await _compare(_reviewVersion, version)
}

export async function getScdVersion () {
  return await _getVersion(_scdVersion)
}

export async function isScdUpdated () {
  let savedVersion = ''
  try {
    const { data } = await wx.getStorage({ key: STORAGE_KEYS.SCD_FOODS_VERSION })
    savedVersion = data
  } catch (e) {
    error(e)
  }
  return await _compare(_scdVersion, savedVersion)
}
