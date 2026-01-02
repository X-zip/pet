// pages/selectCampus/selectCampus.js
const app = getApp()
var api = require('../../config/api.js');
import Toast from '@vant/weapp/toast/toast';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏高度
    navBarHeight: 0,
    statusBarHeight: 0,
    mainActiveIndex: 0,
    activeId: null,
    activeName: null,
    items:[
      {
        text: '广州',
        disabled: false,
        // children: [{text: '广州校园圈',id: 0},{text: 'UM鼠鼠论坛',id: 1},{text: 'MUST校园圈',id: 2},{text: 'CityU论坛',id: 3},{text: 'MPU论坛',id: 4},{text: 'UTM树懒',id: 5}],
        children: [{text: '天河宠物社区',id: 1},{text: '白云宠物社区',id: 2},{text: '黄埔宠物论坛',id: 3}],
      },
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取导航栏高度
    const systemInfo = wx.getSystemInfoSync();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;
    this.setData({
      navBarHeight: navBarHeight,
      statusBarHeight: systemInfo.statusBarHeight,
    });

    console.log("options",options)
    if (options.campus != null && options.campus != undefined) {
      wx.setStorageSync('campus', options.campus)
      wx.setStorageSync('region', options.region)
      wx.setStorageSync('campusID', options.campusID)
      app.globalData.campus = options.campusID
      app.globalData.region = options.region
      wx.reLaunch({
        url: '/pages/index/index',
        fail: res =>{
          console.log(res)
        }
      })
    }
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  onClickNav({ detail = {} }) {
    this.setData({
      mainActiveIndex: detail.index || 0,
    });
  },

  onClickItem({ detail = {} }) {
    const activeId = this.data.activeId === detail.id ? null : detail.id;
    const activeName = detail.text
    console.log(detail)
    this.setData({ activeId , activeName});
    wx.setStorageSync('campus', detail.text)
    wx.setStorageSync('campusID', detail.id)
    app.globalData.campus = detail.id
    console.log(app.globalData.campus)

  },

  openApp() {
    var activeId = this.data.activeId
    if (activeId === undefined || activeId === null) {
      Toast('请选择地区！');
    } else {
        wx.request({
            url: api.SetCampusRegion,
            method:'GET',
            data: {
              openid:app.globalData.openid,
              campus:app.globalData.campus,
              region:app.globalData.region,
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
            //   console.log(res.data)
              if(res.data.res > 0) {
                wx.reLaunch({
                    url: '/pages/index/index',
                    fail: res =>{
                      console.log(res)
                    }
                })
              } else {
                  wx.showToast({
                    title: '请重试',
                    icon:none
                  })
              }
            },
        }) 
      
    }   
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

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})