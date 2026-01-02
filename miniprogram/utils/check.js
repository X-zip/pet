
async function checkString(content,openid) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: "https://www.yqtech.ltd:8802/msgCheckQuanzi",
        // url:"https://192.168.1.94:8802/msgCheckQuanzi",
      method:'GET',
      data: {
        openid:openid,
        content: content,
        campus: "8",
        appid:"wxca56e7a3e874233a"
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: (result) => {
        console.log(result)
        resolve(result.data.result.result.suggest == 'pass');
      },
      fail: (err) => {
          reject(err);
      }
    })
  }) 
}
module.exports = {
checkString: checkString
}