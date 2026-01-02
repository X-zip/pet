var api = require('../../../config/api.js');
const app = getApp();

Page({
  data: {
    id: '',
    qr_pic: '',
    name: ''
  },

  onLoad(options) {
    const id = options.id;
    this.setData({ id });

    wx.showLoading({ title: '加载中' });
    wx.request({
      url: api.GetGroupBuyByIdXiaoyuan,
      method: 'GET',
      data: {
        id: id,
        region: app.globalData.region,
        campus: app.globalData.campus
      },
      success: (res) => {
        wx.hideLoading();
        const pintuan = res.data.res[0];
        this.setData({
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
      }
    });
  },

  backHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  },

  previewQr() {
    wx.previewImage({
      current: this.data.qr_pic,
      urls: [this.data.qr_pic]
    });
  }
});
