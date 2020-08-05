const cloud = require('wx-server-sdk')

cloud.init()
const db = cloud.database()

// 云函数入口函数
exports.main = async ({ name }) => {
  try {
    return await db.collection('scd-foods')
      .where({
        name: db.RegExp({ regexp: `^.*${name}.*$`, options: 'i' })
      })
      .get()
  } catch (e) {
    console.log(e)
    return e
  }
}
