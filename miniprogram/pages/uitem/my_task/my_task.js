const api = require("../../../config/api");

// pages/my_task/my_task.js
var app = getApp();
var CryptoJS = require('../../../utils/aes.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    tasks: [],
    noMore:false,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function() {
    var that = this
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
      
    }
  },

  goToStoryDetail(e) {
    console.log("e.target.dataset" + JSON.stringify(e.target.dataset))
    wx.navigateTo({
      url: '../../detail/detail?id=' + e.currentTarget.dataset.id
    })
  },

  
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    var that = this
    that.setData({
      tasks: []
    })
    that.getTaskInfo()
  },

  getTaskInfo() {
    var that = this
    var old_data = that.data.tasks;
    var length = old_data.length
    wx.request({
      url: api.GettaskbyOpenid,
      method:'GET',
      data: {
        openid: app.globalData.openid,
        length: parseInt(length),
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        var data = res.data.taskList
        for (var i in data){
          data[i].img = data[i].img.replace('[','').replace(']','').replace('\"','').replace('\"','').split(',')
        }
        console.log(data)
        wx.hideLoading()
        that.setData({
          tasks: old_data.concat(data)
        })
        if (res.data.taskList.length == 0) {
          that.setData({
            noMore: true
          })
          wx.showToast({
            title: '没有更多内容',
            icon: 'none'
          })
        }
      },
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.showLoading({
      title: '加载中，请稍后',
      mask: true,
    })
    this.setData({
      tasks: []
    })
    this.getTaskInfo()
  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function () {
    wx.showLoading({
      title: '加载中，请稍后',
      mask: true,
    })
    this.getTaskInfo()
    if (this.data.noMore) {
      wx.showToast({
        title: '没有更多内容',
        icon: 'none'
      })
    } 
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})