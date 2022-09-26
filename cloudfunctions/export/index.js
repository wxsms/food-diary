const cloud = require('wx-server-sdk');
const xlsx = require('node-xlsx');
const _ = require('lodash');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});
const db = cloud.database();
const cmd = db.command;
const MAX_LIMIT = 100;
// const dateOffset = 8 * 60 * 60 * 1000
// TZ=Asia/Shanghai 设置后为 +8 时区，无需偏移
// const dateOffset = 0
const ERROR_CODES = {
  RATE: -10001,
  NO_RECORD: -10002
};

const TYPES = {
  DATE: { label: '日期', key: 'date' },
  BREAKFAST: { label: '早餐', key: 'breakfast' },
  LUNCH: { label: '午餐', key: 'lunch' },
  DINNER: { label: '晚餐', key: 'dinner' },
  SUPPLEMENT: { label: '补充', key: 'supplement' },
  OTHERS: { label: '其它', key: 'others' },
  ABNORMAL: { label: '异常', key: 'abnormal' },
  WEIGHT: { label: '体重 (kg)', key: 'weight' },
  DEFECATION: { label: '排便次数', key: 'defecation' },
  DEFECATION_REMARK: { label: '排便情况', key: 'defecationRemark' }
};

// 云函数入口函数
exports.main = async ({ actionType, from, to, groupBy = 'month' }, context) => {
  try {
    const wxContext = cloud.getWXContext();
    // 检测是否允许调用
    // const rateWhere = {
    //   _openid: wxContext.OPENID,
    //   module: 'export',
    //   type: 'daily'
    // }
    // const rateRes = await db
    //   .collection('rate-limit')
    //   .where(rateWhere)
    //   .get()
    // if (rateRes.data && rateRes.data.length) {
    //   // 超限调用，拒绝
    //   console.log('rate limit exceed.')
    //   return ERROR_CODES.RATE
    // }
    // 查询条件
    if (actionType === 'scd') {
      const { total } = await db
        .collection('scd-foods')
        .count();
      const batchTimes = Math.ceil(total / MAX_LIMIT);
      let foods = [];
      for (let i = 0; i < batchTimes; i++) {

        let res = await db
          .collection('scd-foods')
          .skip(i * MAX_LIMIT)
          .limit(MAX_LIMIT)
          .get();
        foods = [].concat(foods, res.data);
      }
      // console.log(foods);
      const record = (await db
        .collection('records-scd')
        .where({
          _openid: wxContext.OPENID
        })
        .get()).data[0];
      // console.log(record);
      // 生成 excel

      // console.log(groupedData)
      const sheets = [];
      const sheet = [];
      sheet.push([ '食物', '耐受情况', '额外描述']);
      foods.forEach(food => {
        const arr = [];
        arr.push(food.name)
        if (record[food._id]) {
          let m = {
            '-1': '待定',
            '1': '耐受',
            '2': '不耐受',
            '0': '没吃过',
          }
          arr.push(m[record[food._id].status])
          arr.push((record[food._id].desc || []).join(','))
        } else {
          arr.push('')
          arr.push('')
        }

        sheet.push(arr);
      });
      sheets.push({
        name: 'sheet',
        data: sheet
      });

      const buffer = await xlsx.build(sheets, {
        '!cols': [
          { wch: 30 },
          { wch: 30 },
          { wch: 30 },
        ]
      });
      // 上传至云储存
      const { fileID } = await cloud.uploadFile({
        cloudPath: `records-export-${wxContext.OPENID}-scd.xlsx`,
        fileContent: buffer,
      });
      // 获取临时下载链接
      const res = await cloud.getTempFileURL({
        fileList: [fileID]
      });
      // console.log(res.fileList[0].tempFileURL)
      return res.fileList[0].tempFileURL;
    }

    const where = {
      _openid: wxContext.OPENID
    };
    if (typeof from === 'number' && typeof to === 'number') {
      // 设置查询日期范围
      where.date = cmd.gte(from).and(cmd.lt(to));
    }
    // 获取总数
    const { total } = await db
      .collection('records')
      .where(where)
      .count();
    if (total === 0) {
      // 查询无记录
      return ERROR_CODES.NO_RECORD;
    }
    const batchTimes = Math.ceil(total / MAX_LIMIT);
    const tasks = [];
    for (let i = 0; i < batchTimes; i++) {
      tasks.push(db
        .collection('records')
        .where(where)
        .orderBy('date', 'asc')
        .skip(i * MAX_LIMIT)
        .limit(MAX_LIMIT)
        .get());
    }
    // tasks.push(db
    //   .collection('rate-limit')
    //   .add({
    //     data: {
    //       ts: Date.now(),
    //       ...rateWhere
    //     }
    //   }))
    // 分批次获取所有范围内的数据
    const recordsRes = await Promise.all(tasks);
    // recordsRes.pop()
    const { data } = recordsRes.reduce((acc, cur) => ({
      data: acc.data.concat(cur.data),
      errMsg: acc.errMsg
    }));
    // 生成 excel
    const keys = [
      TYPES.DATE,
      TYPES.BREAKFAST,
      TYPES.LUNCH,
      TYPES.DINNER,
      TYPES.SUPPLEMENT,
      TYPES.WEIGHT,
      TYPES.DEFECATION,
      TYPES.DEFECATION_REMARK,
      TYPES.OTHERS,
      TYPES.ABNORMAL
    ];
    // 按年或月分组
    const groupedData = _.groupBy(data, v => {
      const date = new Date(v.date);
      if (groupBy === 'year') {
        return `${date.getFullYear()}`;
      } else {
        return `${date.getFullYear()}-${date.getMonth() + 1}`;
      }
    });
    // console.log(groupedData)
    const sheets = [];
    Object.keys(groupedData).forEach(key => {
      const data = groupedData[key];
      const sheet = [];
      sheet.push(keys.map(v => v.label));
      data.forEach(row => {
        const arr = [];
        keys.map(v => v.key).forEach(v => {
          if (v === 'date') {
            const date = new Date(row[v]);
            arr.push(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`);
          } else {
            const isExist = typeof row[v] !== 'undefined' && row[v] !== null;
            arr.push(isExist ? row[v] : '');
          }
        });
        sheet.push(arr);
      });
      sheets.push({
        name: key,
        data: sheet
      });
    });
    const buffer = await xlsx.build(sheets, {
      '!cols': [
        { wch: 10 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 20 },
        { wch: 10 },
        { wch: 10 },
        { wch: 10 },
        { wch: 20 },
        { wch: 20 }
      ]
    });
    // 上传至云储存
    const { fileID } = await cloud.uploadFile({
      cloudPath: `records-export-${wxContext.OPENID}.xlsx`,
      fileContent: buffer,
    });
    // 获取临时下载链接
    const res = await cloud.getTempFileURL({
      fileList: [fileID]
    });
    return res.fileList[0].tempFileURL;
  } catch (e) {
    console.log(e);
    return e;
  }
};
