const cloud = require('wx-server-sdk')
cloud.init()
exports.main = async (event, context) => {
  try {
    const result = await cloud.openapi.subscribeMessage.send({
      "touser": event.openid,
      "page": event.page,
      "lang": 'zh_CN',
      "data": {
        "thing1": {
          "value": event.title
        },
        "thing2": {
          "value": event.comment
        },
        "date3": {
          "value": event.time
        },
      },
      "templateId": 'fyz3MRiIpzyWuzxsTpk0tBgZTi2MDnJmlGSPM0ZdAtI',
    })
    return result.result.errCode
  } catch (err) {
    return err
  }
}