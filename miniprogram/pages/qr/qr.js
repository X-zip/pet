// pages/qr/qr.js
var api = require('../../config/api.js');
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        var that = this
        wx.request({
            url: api.GetQRList,
            method:'GET',
            data: {
                campus:app.globalData.region
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
              that.setData({
                qrList:res.data.qrList
              })
              console.log(res.data.qrList)
            }
        })

    },

    imgYu: function(event) {
        var urlList = []
        urlList = urlList.concat(event.currentTarget.dataset.id)
        wx.previewImage({
          urls: urlList,
        })
      },

      
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    onShareAppMessage: function() {
      wx.showShareMenu({
          withShareTicket: true,
          menus: ['shareAppMessage', 'shareTimeline']
        })
    },
    //用户点击右上角分享朋友圈
    onShareTimeline: function () {
      return {
          title: '扫码进功能群，想要什么群请告诉我',
          imageUrl: 'https://img.yqtech.ltd/macao/logo/anyway.jpg'
        }
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})