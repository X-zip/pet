import Toast from '@vant/weapp/toast/toast';

Page({
  data: {
    navBarHeight: 0,
    statusBarHeight: 0,
    activeTab: 'all',
    loading: true,
    refreshing: false,
    list: [],
    verifyPopup: {
      show: false,
      code: '',
      qr: ''
    }
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;
    const tab = options.tab || 'all';
    this.setData({
      navBarHeight,
      statusBarHeight: systemInfo.statusBarHeight,
      activeTab: tab
    }, () => {
      this.loadList(true);
    });
  },

  onTabChange(e) {
    const tab = e.detail.name;
    this.setData({ activeTab: tab, list: [], loading: true }, () => {
      this.loadList(true);
    });
  },

  onRefresh() {
    this.setData({ refreshing: true }, () => {
      this.loadList(true);
    });
  },

  onReachBottom() {
    // 预留分页，可接入 page/size
    this.loadList(false);
  },

  loadList(reset = false) {
    // TODO: 接口替换为真实 GetOrderList
    const mock = this.mockOrders(this.data.activeTab);
    this.setData({
      list: reset ? mock : [...this.data.list, ...mock],
      loading: false,
      refreshing: false
    });
  },

  mockOrders(tab) {
    const base = [
      {
        order_id: 'g1',
        order_no: 'PT20250001',
        source: 'group',
        title: '【拼团】宠物主粮组合包',
        cover: 'https://img.yzcdn.cn/vant/cat.jpeg',
        price: 88,
        quantity: 2,
        pay_amount: 176,
        create_time: '2025-01-01 12:30',
        status: 'pending_pay',
        status_text: '待支付'
      },
      {
        order_id: 's1',
        order_no: 'SV20250002',
        source: 'service',
        title: '宠物医院·疫苗套餐',
        cover: 'https://img.yzcdn.cn/vant/cat.jpeg',
        price: 168,
        quantity: 1,
        pay_amount: 168,
        create_time: '2025-01-01 10:20',
        status: 'pending_verify',
        status_text: '待核销',
        verify_code: 'SV123456',
        verify_qr_url: 'https://img.yzcdn.cn/vant/cat.jpeg'
      },
      {
        order_id: 'g2',
        order_no: 'PT20250003',
        source: 'group',
        title: '【拼团】猫砂 10kg',
        cover: 'https://img.yzcdn.cn/vant/cat.jpeg',
        price: 59,
        quantity: 1,
        pay_amount: 59,
        create_time: '2025-01-01 09:00',
        status: 'done',
        status_text: '已完成'
      },
      {
        order_id: 's2',
        order_no: 'SV20250004',
        source: 'service',
        title: '上门洗护',
        cover: 'https://img.yzcdn.cn/vant/cat.jpeg',
        price: 200,
        quantity: 1,
        pay_amount: 200,
        create_time: '2025-01-02 14:10',
        status: 'after_sale',
        status_text: '售后/退款'
      }
    ];
    if (tab === 'all') return base;
    if (tab === 'pending_pay') return base.filter(o => o.status === 'pending_pay');
    if (tab === 'pending_verify') return base.filter(o => o.status === 'pending_verify');
    if (tab === 'done') return base.filter(o => o.status === 'done');
    if (tab === 'after_sale') return base.filter(o => o.status === 'after_sale');
    return base;
  },

  onPay(e) {
    const id = e.currentTarget.dataset.id;
    console.log('pay', id);
    Toast('支付流程待接入');
  },

  onShowVerify(e) {
    const id = e.currentTarget.dataset.id;
    const target = this.data.list.find(o => o.order_id === id);
    if (!target) return;
    const qr = target.verify_qr_url || '';
    const code = target.verify_code || '';
    if (!qr && !code) {
      Toast('核销码获取中');
      return;
    }
    this.setData({
      verifyPopup: {
        show: true,
        code: code || '核销码',
        qr: qr || ''
      }
    });
  },

  closeVerifyPopup() {
    this.setData({ verifyPopup: { show: false, code: '', qr: '' } });
  },

  onAfterSale(e) {
    Toast('售后流程待接入');
  },

  onRebuy(e) {
    Toast('再次购买待接入');
  },

  onNavBack() {
    const pages = getCurrentPages();
    if (pages && pages.length > 1) {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          this.fallbackToHome();
        }
      });
    } else {
      this.fallbackToHome();
    }
  },

  fallbackToHome() {
    wx.switchTab({
      url: '/pages/index/index',
      fail: () => {
        wx.reLaunch({ url: '/pages/index/index' });
      }
    });
  }
});

