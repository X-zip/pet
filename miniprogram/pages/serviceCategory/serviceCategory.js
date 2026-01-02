Page({
  data: {
    navBarHeight: 0,
    statusBarHeight: 0,
    cateId: '',
    cateName: '',
    list: [],
    loading: true,
    chips: [
      { key: 'nearby', text: '附近', active: true },
      { key: 'rating', text: '评分高', active: false },
      { key: 'price', text: '价格低', active: false },
    ],
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;

    const cateId = options.cateId || '';
    const cateName = decodeURIComponent(options.cateName || '');

    const mockServiceMap = {
      '1': [
        { id: 'svc101', title: '宠物保险·基础版', desc: '意外医疗保障 · 快速理赔', price: '￥59 起', distance: '线上', img: 'https://img.yzcdn.cn/vant/cat.jpeg' },
        { id: 'svc102', title: '宠物保险·升级版', desc: '更高保额 · 覆盖更全', price: '￥99 起', distance: '线上', img: 'https://img.yzcdn.cn/vant/cat.jpeg' },
      ],
      '2': [
        { id: 'svc201', title: '天河宠物医院', desc: '24小时急诊 · 体检疫苗 · 专业诊疗', price: '￥168 起', distance: '距你 1.2km', img: 'https://img.yzcdn.cn/vant/cat.jpeg' },
      ],
      '3': [
        { id: 'svc301', title: '爱宠美容中心', desc: '专业洗护 · 造型设计 · 宠物SPA', price: '￥88 起', distance: '距你 0.8km', img: 'https://img.yzcdn.cn/vant/cat.jpeg' },
      ],
    };

    this.setData({
      statusBarHeight: systemInfo.statusBarHeight,
      navBarHeight,
      cateId,
      cateName,
      list: mockServiceMap[cateId] || [],
      loading: false,
    });
  },

  goBack() {
    wx.navigateBack();
  },

  onServiceTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/pintuanDetail/pintuanDetail?id=${id}&source=service`
    });
  },

  onChipTap(e) {
    const key = e.currentTarget.dataset.key;
    this.setData({
      chips: this.data.chips.map(chip => ({
        ...chip,
        active: chip.key === key,
      }))
    });
  }
});

