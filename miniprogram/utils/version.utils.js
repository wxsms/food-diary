export const version = '1.2.0'

let _isReview = null

export const isReview = async () => {
  if (typeof _isReview === 'boolean') {
    return _isReview
  }
  try {
    const db = wx.cloud.database()
    const res = await db.collection('versions').get()
    _isReview = res.data[0].review === version
    return _isReview
  } catch (e) {
    return false
  }
}
