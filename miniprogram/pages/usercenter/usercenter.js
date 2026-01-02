// pages/usercenter/usercenter.js
var app = getApp();
const api = require("../../config/api");
import Toast from '@vant/weapp/toast/toast';

Page({
  data: {
    navH: app.globalData.navHeight,
    avatar: '',
    userName: '',
    isVerified: -1
  },

  // ===== 圈子入口：必须恢复跳转 =====
  toMytask() {
    wx.navigateTo({ url: '../uitem/my_task/my_task' })
  },
  toMylike() {
    wx.navigateTo({ url: '../uitem/my_like/my_like' })
  },
  toComment() {
    wx.navigateTo({ url: '../uitem/myComment/myComment' })
  },
  toReply() {
    wx.navigateTo({ url: '../uitem/myReply/myReply' })
  },

  // ===== 订单入口：先保留占位（你后面会接支付/核销逻辑）=====
  toOrderListAll() {
    wx.navigateTo({ url: '/pages/order/orderList/orderList?tab=all' });
  },
  toOrderListPending() {
    wx.navigateTo({ url: '/pages/order/orderList/orderList?tab=pending_pay' });
  },
  toOrderVerify() {
    wx.navigateTo({ url: '/pages/order/orderList/orderList?tab=pending_verify' });
  },
  toAfterSale() {
    wx.navigateTo({ url: '/pages/order/orderList/orderList?tab=after_sale' });
  },
  toOrderHistory() {
    wx.navigateTo({ url: '/pages/order/orderList/orderList?tab=done' });
  },

  // ===== 其他入口 =====
  toContact() {
    wx.navigateTo({ url: '../uitem/contact/contact' })
  },
  toSuggestion() {
    wx.navigateTo({ url: '../uitem/suggestion/suggestion' })
  },

  navLogin() {
    wx.navigateTo({ url: '../uitem/login/login' })
  },

  getMember() {
    wx.request({
      url: api.GetMember,
      method: 'GET',
      data: {
        openid: app.globalData.openid,
        campus: app.globalData.region
      },
      header: { 'content-type': 'application/json' },
      success(res) {
        const member = (res.data && res.data.memberList && res.data.memberList[0]) || null;
        if (member && member.au4 > 0) {
          wx.setStorageSync('isdel', true)
        } else {
          wx.setStorageSync('isdel', false)
        }
      }
    })

    // 订阅消息逻辑保留
    let tmplIds = [];
    tmplIds[0] = app.globalData.template_id;
    wx.requestSubscribeMessage({
      tmplIds,
      success() {
        if (wx.getStorageSync('subNum')) {
          let num = Number(wx.getStorageSync('subNum'));
          wx.setStorageSync('subNum', num + 1);
        } else {
          wx.setStorageSync('subNum', 1);
        }
      }
    })
  },

  onLoad() {
    this.setData({
      avatar: wx.getStorageSync('avatar'),
      userName: wx.getStorageSync('userName')
    })

    if (wx.getStorageSync('getMember') != 1) {
      this.getMember()
      wx.setStorageSync('getMember', "1")
    }
  },

  onShow() {
    // TabBar 高亮
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 4 })
    }

    this.setData({
      avatar: wx.getStorageSync('avatar'),
      userName: wx.getStorageSync('userName')
    })

    if (wx.getStorageSync('getMember') != 1) {
      this.getMember()
      wx.setStorageSync('getMember', "1")
    }
  }
})
