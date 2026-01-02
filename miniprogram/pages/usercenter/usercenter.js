// pages/usercenter/usercenter.js
var app = getApp();
const api = require("../../config/api");
import Toast from '@vant/weapp/toast/toast';
Page({

  /**
   * 页面的初始数据
   */
  data: {
    canIUsegetMember: false,
    tasks: [],
    userInfo: {},
    hasUserInfo: false,
    showmodal: false,
    isauth: false,
    isord: false,
    isinfo: false,
    ispt: false,
    isdel: false,
    ismod: false,
    menu: {
      imgUrls: [
        '../../images/mypost.png',
        '../../images/mylike.png',
        '../../images/mycomment.png',
        '../../images/myreply.png',
      ],
      descs: [
        '我发布的',
        '我喜欢的',
        '我评论的',
        '回复通知',
      ],
      name: [
        'post',
        'like',
        'comment',
        'reply',
      ]
    },
    navH: app.globalData.navHeight,
    isVerified:-1
  },

  toComment() {
    wx.navigateTo({
      url: '../uitem/myComment/myComment',
    })
  },
  toReply() {
    wx.navigateTo({
      url: '../uitem/myReply/myReply',
    })
  },

  getMember: function(e) {
    wx.request({
        url: api.GetMember,
        method:'GET',
        data: {
          openid: app.globalData.openid,
          // campus:app.globalData.campus
          campus:app.globalData.region
        },
        header: {
          'content-type': 'application/json' // 默认值
        },
        success (res) {
          console.log('member',res.data.memberList[0])
          if (res.data.memberList[0].au4 > 0) {
            wx.setStorageSync('isdel', true)
          } else {
            wx.setStorageSync('isdel', false)
          }
        },
    })
    let tmplIds=[];
    tmplIds[0] = app.globalData.template_id
    console.log("tmplIds",tmplIds)
    wx.requestSubscribeMessage({
      tmplIds: tmplIds,
      success(res) {
        console.log(res.data)
        if (wx.getStorageSync('subNum')) {
          var num = Number(wx.getStorageSync('subNum'))
          num += 1
          wx.setStorageSync('subNum', num)
        } else {
          wx.setStorageSync('subNum', 1)
        }
      }
    })
  },

  navLogin: function(e) {
    wx.navigateTo({
      url: '../uitem/login/login',
    })
  },


  hideModal() {
    this.setData({
      showmodal: false
    })
  },
  toApplication: function() {
    var that = this
    var isVerified = that.data.isVerified
    console.log(isVerified,that.data.isVerified)
    if (isVerified == -1) {
        wx.navigateTo({
            url: '../application/application',
        })
    } else if (isVerified == 0) {
        Toast('请耐心等待认证结果');
    } else {
        Toast('已认证');
    }  
  },
  toCampusVerify: function() {
    var that = this
    var isVerified = that.data.isVerified
    console.log(isVerified,that.data.isVerified)
    if (isVerified == -1) {
        wx.navigateTo({
            url: '../campusVerify/campusVerify',
        })
    } else if (isVerified == 0) {
        Toast('请耐心等待认证结果');
    } else {
        Toast('已认证');
    }  
  },
  toMytask: function() {
    wx.navigateTo({
      url: '../uitem/my_task/my_task',
    })
  },
  toMylike: function() {
    wx.navigateTo({
      url: '../uitem/my_like/my_like',
    })
  },
  toContact: function() {
      wx.navigateTo({
        url: '../uitem/contact/contact',
      })
  },
  toSuggestion: function() {
    wx.navigateTo({
      url: '../uitem/suggestion/suggestion',
    })
  },

  toRule: function() {
    wx.navigateTo({
      url: '../uitem/rule/rule',
    })
  },

  toQR() {
    wx.navigateTo({
      url: '../uitem/qr/qr',
    })
  },
  
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function() {
    this.setData({
      avatar: wx.getStorageSync('avatar'),
      userName:wx.getStorageSync('userName'),
    //   isVerified : wx.getStorageSync('isVerified')
    }) 
    if (wx.getStorageSync('getMember') != 1) {
      this.getMember()
      wx.setStorageSync('getMember',"1")
    }
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
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2  // 我的页面是第三个tab（索引2）
      })
    }
    this.setData({
      avatar: wx.getStorageSync('avatar'),
      userName:wx.getStorageSync('userName'),
    //   isVerified:wx.getStorageSync('isVerified'),
    }) 
    if (wx.getStorageSync('getMember') != 1) {
      this.getMember()
      wx.setStorageSync('getMember',"1")
    }
  },

  selectCampus () {
    wx.navigateTo({
      url: '/pages/selectCampus/selectCampus'
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
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})