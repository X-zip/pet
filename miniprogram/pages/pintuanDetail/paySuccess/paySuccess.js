import Toast from '@vant/weapp/toast/toast';

Page({
  data: {
    navBarHeight: 0,
    statusBarHeight: 0,
    amount: '0.00',
    orderNo: '',
    payTime: '',
    source: 'group',
    verifyCode: '',
    qrText: '',
    qrImg: ''
  },

  onLoad(options) {
    const systemInfo = wx.getSystemInfoSync();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;

    const amount = options.amount || '12.80';
    const orderNo = options.orderNo || this._genOrderNo();
    const payTime = this._formatTime(new Date());
    const source = options.source || 'group';

    let verifyCode = '';
    let qrText = '';
    let qrImg = '';
    if (source === 'service') {
      verifyCode = 'SV' + (Date.now() % 1000000);
      qrText = `service|${orderNo}|${verifyCode}`;
      // 占位二维码，可替换为实际生成结果
      qrImg = 'https://img.yzcdn.cn/vant/cat.jpeg';
    }

    this.setData({
      navBarHeight,
      statusBarHeight: systemInfo.statusBarHeight,
      amount,
      orderNo,
      payTime,
      source,
      verifyCode,
      qrText,
      qrImg
    });
  },

  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  goOrder() {
    Toast('订单页暂未接入（示例）');
    // 若已有订单页，可替换为：wx.navigateTo({ url: '/pages/order/list' })
  },

  goHome() {
    const { source } = this.data;
    if (source === 'service') {
      wx.switchTab({
        url: '/pages/service/service',
        fail: () => {
          wx.reLaunch({ url: '/pages/service/service' });
        }
      });
      return;
    }
    wx.switchTab({
      url: '/pages/index/index',
      fail: () => {
        wx.reLaunch({ url: '/pages/index/index' });
      }
    });
  },

  _genOrderNo() {
    const t = Date.now().toString();
    const rnd = Math.floor(Math.random() * 9000 + 1000);
    return `PT${t}${rnd}`;
  },

  _formatTime(d) {
    const pad = (n) => (n < 10 ? '0' + n : '' + n);
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${y}/${m}/${day} ${hh}:${mm}:${ss}`;
  }
});

