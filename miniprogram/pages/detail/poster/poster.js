const app = getApp()

Page({
  data: {

  },
  onLoad(options) {
    var content = options.content
    var url = options.url
    this.setData({
        content:content,
        url:url
    })
    var campusName = wx.getStorageSync('campus')
    console.log(campusName)
    if (campusName == 'UM鼠鼠论坛') {
        this.setData({
            logo_url:"https://img.yqtech.ltd/macao/logo/um_logo.png",
            campusName:campusName
        })
    } else if (campusName == 'UTM树懒') {
        this.setData({
            logo_url:"https://img.yqtech.ltd/macao/logo/UTM.png",
            campusName:campusName
        })
    } else {
        this.setData({
            logo_url:"",
            campusName:campusName
        })
    }
  },

  tap() {
    let isCanUse= wx.canIUse('Snapshot.takeSnapshot');//基础库 3.0.1 开始支持
    if(!isCanUse){
      console.log("不可以使用");
      return;
    }
    this.createSelectorQuery().select("#view")
      .node().exec(res => {
        console.log(res);
        const node = res[0].node
        node.takeSnapshot({
          // type: 'file' 且 format: 'png' 时，可直接导出成临时文件
          type: 'arraybuffer',
          format: 'png',
          success: (res) => {
            const f = `${wx.env.USER_DATA_PATH}/hello.png`
            const fs = wx.getFileSystemManager();
            fs.writeFileSync(f, res.data, 'binary')
            wx.showToast({
              title: '保存成功'
            })

            wx.saveImageToPhotosAlbum({
              filePath: f,
              complete(res) {
                console.log("saveImageToPhotosAlbum:", res)
              }
            })
          },
          fail(res) {
            console.log("takeSnapshot fail:", res)
          }
        })
      })
  }
})
