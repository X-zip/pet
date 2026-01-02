// pages/pintuanDetail/pintuanDetail.js
var api = require('../../config/api.js');
const app = getApp()
Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 导航栏高度
    navBarHeight: 0,
    statusBarHeight: 0,
    // 仅用于 UI 展示的占位数据（不影响业务）
    soldCount: 345,
    locationText: '重庆',
    shippingText: '快递：免运费',
    rankText: '社区拼团热销榜 · 第2名',
    thumb_list: [],
    mockParams: [
      { k: '商品分类', v: '罐装' },
      { k: '规格/尺寸', v: '正常规格' },
      { k: '品牌', v: '路斯' },
      { k: '产地', v: '重庆' },
      { k: '适用对象', v: '中小型犬' },
      { k: '成分/材质', v: '鸭肉' },
    ],
    mockReviews: [
      {
        id: 1,
        name: '微信用户',
        time: '2025/05/16 11:23:34',
        content: '牧造效果不错，小姐姐很好，摄影师也很有耐心，会指导动作，效果不错！',
        stars: 5,
      },
      {
        id: 2,
        name: '微信用户',
        time: '2025/05/16 11:23:34',
        content: '牧造效果不错，小姐姐很好，摄影师也很有耐心，会指导动作，效果不错！',
        stars: 5,
      },
    ],
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

    var id = options.id
    var that = this
    wx.showLoading({
      title: '加载中',
    })
    wx.request({
        url: api.GetGroupBuyByIdXiaoyuan,
        method:'GET',
        data: {
            id:id,
            region:app.globalData.region,
            campus:app.globalData.campus
        },
        header: {
            'content-type': 'application/json' // 默认值
        },
        success (res) {
            wx.hideLoading()
            console.log(res.data.res)
            var pintuan = res.data.res[0]
            const posterList = pintuan.poster_pic ? pintuan.poster_pic.split(',').filter(url => url.trim() !== '') : [];
            const thumbList = posterList.slice(0, 3);
            that.setData({
                poster_list: posterList,
                thumb_list: thumbList.length ? thumbList : (pintuan.main_pic ? [pintuan.main_pic] : []),
                id: pintuan.id,
                name: pintuan.name,
                description: pintuan.description,
                current_price: pintuan.current_price,
                ori_price: pintuan.ori_price,
                discount: pintuan.discount,
                main_pic: pintuan.main_pic,
                poster_pic: pintuan.poster_pic,
                qr_pic: pintuan.qr_pic,
                campus: pintuan.campus,
                region: pintuan.region,
                c_time: pintuan.c_time
            });
        },
    })
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  submitInfo(e) {
    const id = e.currentTarget.dataset.id;
    console.log(e)
    wx.navigateTo({
      url: '/pages/pintuanDetail/groupInfoForm/groupInfoForm?id=' + id
    });
  },

  onTapFav() {
    wx.showToast({ title: '已收藏（示例）', icon: 'none' })
  },

  onTapShare() {
    wx.showToast({ title: '点击右上角分享（示例）', icon: 'none' })
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