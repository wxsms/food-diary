const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
// 云函数入口函数
exports.main = async ({ limit }) => {
  try {
    const _ = db.command
    const before100Days = new Date()
    before100Days.setDate(before100Days.getDate() - 100)
    // console.log(before100Days)
    const wxContext = cloud.getWXContext()
    return await db.collection('records')
      .field({
        _id: false,
        weight: true,
        date: true
      })
      .where({
        _openid: wxContext.OPENID,
        date: _.gte(before100Days.getTime())
      })
      .orderBy('date', 'desc')
      .limit(limit || 100)
      .get()
  } catch (e) {
    console.log(e)
    return e
  }
}
