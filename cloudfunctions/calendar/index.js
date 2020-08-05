const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()
// 云函数入口函数
exports.main = async ({ from, to }) => {
  try {
    const wxContext = cloud.getWXContext()
    const cmd = db.command
    return await db.collection('records')
      .where({
        _openid: wxContext.OPENID,
        date: cmd.gte(from).and(cmd.lt(to))
      })
      .get()
  } catch (e) {
    console.log(e)
    return e
  }
}
