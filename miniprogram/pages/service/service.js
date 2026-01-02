// pages/service/service.js
const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    navBarHeight: 0,
    statusBarHeight: 0,
    // Mock 服务列表数据
    mockServiceList: [
      {
        id: 1,
        title: '天河宠物医院',
        desc: '24小时急诊 · 体检疫苗 · 专业诊疗',
        price: '￥168 起',
        distance: '距你 1.2km',
        img: 'https://img.yzcdn.cn/vant/cat.jpeg'
      },
      {
        id: 2,
        title: '爱宠美容中心',
        desc: '专业洗护 · 造型设计 · 宠物SPA',
        price: '￥88 起',
        distance: '距你 0.8km',
        img: 'https://img.yzcdn.cn/vant/cat.jpeg'
      },
      {
        id: 3,
        title: '宠物寄养酒店',
        desc: '温馨舒适 · 24小时看护 · 专业护理',
        price: '￥120/天',
        distance: '距你 2.5km',
        img: 'https://img.yzcdn.cn/vant/cat.jpeg'
      },
      {
        id: 4,
        title: '宠物用品商店',
        desc: '正品保障 · 种类齐全 · 送货上门',
        price: '￥50 起',
        distance: '距你 1.5km',
        img: 'https://img.yzcdn.cn/vant/cat.jpeg'
      },
      {
        id: 5,
        title: '上门宠物服务',
        desc: '上门洗护 · 上门诊疗 · 上门训练',
        price: '￥200 起',
        distance: '距你 3.0km',
        img: 'https://img.yzcdn.cn/vant/cat.jpeg'
      }
    ],
    // 功能宫格数据
    featureGrid: [
      { id: 1, name: '宠物保险', icon: '../../images/icon/insurance.png' },
      { id: 2, name: '宠物医院', icon: '../../images/icon/hospital.png' },
      { id: 3, name: '美容洗护', icon: '../../images/icon/bath.png' },
      { id: 4, name: '寄养酒店', icon: '../../images/icon/hotel.png' },
      { id: 5, name: '宠物出行', icon: '../../images/icon/travel.png' },
      { id: 6, name: '宠物活动中心', icon: '../../images/icon/activity.png' },
      { id: 7, name: '宠物友好餐厅', icon: '../../images/icon/friendly.png' }
    ]
  },

  /**
   * 返回上一页
   */
  goBack() {
    wx.navigateBack();
  },

  /**
   * 功能宫格点击
   */
  onFeatureTap(e) {
    const { id, name } = e.currentTarget.dataset;
    const cateId = id;
    const cateName = encodeURIComponent(name || '');
    wx.navigateTo({
      url: `/pages/serviceCategory/serviceCategory?cateId=${cateId}&cateName=${cateName}`
    });
  },

  /**
   * 服务卡片点击
   */
  onServiceTap(e) {
    const id = e.currentTarget.dataset.id;
    console.log('点击服务:', id);
    wx.navigateTo({
      url: `/pages/pintuanDetail/pintuanDetail?id=${id}&source=service`
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 获取导航栏高度（与 group 页面保持一致）
    const systemInfo = wx.getSystemInfoSync();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;
    
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      navBarHeight: navBarHeight
    });
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
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 3 });
    }
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
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    
  }
});

