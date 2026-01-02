const api = require("../../config/api");

// pages/search/search.js
var app = getApp();
Page({

  /**
   * Page initial data
   */
  data: {
    tasks: [],
    history_list:[]
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: function (options) {
    var that = this
    that.setData({
        ser_data: options.search_item,
    })
    that.getTaskInfo()
    console.log("search:",options.search_item)
    console.log("campus:",app.globalData.campus)
    console.log("region:",app.globalData.region)
    wx.showLoading({
      title: '加载中',
    })
    //历史记录
    let history = wx.getStorageSync('history_list');

    // 如果新的搜索词已经存在，先将其移除
    let index = history.indexOf(options.search_item);
    if (index !== -1) {
        history.splice(index, 1);
    }
    // 将新搜索词添加到数组的开头
    history = [options.search_item].concat(history);
    // 如果数组超过10个元素，删除最后一个
    if (history.length > 10) {
        history.pop();
    }
    // 更新页面数据
    wx.setStorageSync('history_list', history)
  },

  getTaskInfo() {
    var that = this
    var search = that.data.ser_data
    var old_data = that.data.tasks;
    var length = old_data.length
    console.log(length,search)
    wx.request({
      url: api.GettaskbySearch,
      method:'GET',
      data: {
        search:search,
        length: parseInt(length),
        campus:app.globalData.campus,
        region:app.globalData.region
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        console.log(res)
        var data = res.data.taskList
        for (var i in data){
          data[i].img = data[i].img.replace('[','').replace(']','').replace('\"','').replace('\"','').split(',')
        }
        console.log(data)
        wx.hideLoading()
        that.setData({
          tasks: old_data.concat(data),
        })
      },
    })
  },


  goToStoryDetail(e) {
    console.log("e"+e.currentTarget.dataset.id)
    wx.navigateTo({
      url: '../detail/detail?id=' + e.currentTarget.dataset.id
    })
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function() {

  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function() {

  },

  /**
   * Page event handler function--Called when user drop down
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
  },

  /**
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function() {

  }
})