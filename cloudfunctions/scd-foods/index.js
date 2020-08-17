const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const MAX_LIMIT = 100

// 云函数入口函数
exports.main = async ({ name }) => {
  try {
    // 先取出集合记录总数
    const countResult = await db.collection('scd-foods').count()
    const total = countResult.total
    // 计算需分几次取
    const batchTimes = Math.ceil(total / 100)
    // 承载所有读操作的 promise 的数组
    const tasks = []
    for (let i = 0; i < batchTimes; i++) {
      const promise = db
        .collection('scd-foods')
        .field({
          _id: true,
          id: true,
          name: true,
          py_name: true,
          type: true
        })
        .skip(i * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .get()
      tasks.push(promise)
    }
    // 等待所有
    return (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data),
        errMsg: acc.errMsg,
      }
    })
  } catch (e) {
    console.log(e)
    return e
  }
}
