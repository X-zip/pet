const app = getApp();
const api = require('../../../config/api.js');
import Toast from '@vant/weapp/toast/toast';

Page({
  data: {
    // 导航栏高度
    navBarHeight: 0,
    statusBarHeight: 0,
    // 商品
    id: null,
    name: '',
    current_price: 0,
    ori_price: 0,
    main_pic: '',
    // 订单与配送
    deliveryMode: 'ship', // ship | pickup
    address: {
      name: '张三',
      phone: '18909876789',
      detail: '西班雅森林5期 3栋2单元3楼3号',
      tag: '默认'
    },
    pickup: {
      name: '自提点',
      detail: 'XX自提柜/门店地址',
    },
    // 规格与数量
    skuList: [
      { id:'sku1', title:'#日常款-一袋', priceDelta: 0 },
      { id:'sku2', title:'#日常款-两袋', priceDelta: 0 },
      { id:'sku3', title:'#自然系列', priceDelta: 0 },
    ],
    selectedSkuId: 'sku1',
    packList: [
      { id:'p1', title:'S码-小号', priceDelta: 0 },
      { id:'p2', title:'M码-中号', priceDelta: 0 },
      { id:'p3', title:'L码-大号', priceDelta: 0 },
    ],
    selectedPackId: 'p3',
    quantity: 1,
    unitPrice: '0.00',
    totalPrice: '0.00',
  },

  onLoad(options) {
    // 获取导航栏高度
    const systemInfo = wx.getSystemInfoSync();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;
    this.setData({
      navBarHeight: navBarHeight,
      statusBarHeight: systemInfo.statusBarHeight,
    });

    const id = options.id;
    this.setData({ id });

    // 预留：地址/自提点（目前用 mock，不阻塞渲染）
    this.getAddressList();
    this.getPickupList();

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
          name: pintuan.name,
          current_price: Number(pintuan.current_price || 0),
          ori_price: Number(pintuan.ori_price || 0),
          main_pic: pintuan.main_pic,
        }, () => {
          this.updateTotals();
        });
      }
    });
  },

  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 切换配送方式
  onSwitchDelivery(e) {
    const mode = e.currentTarget.dataset.mode;
    if (mode === this.data.deliveryMode) return;
    this.setData({ deliveryMode: mode });
  },

  // 规格选择
  onSelectSku(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedSkuId: id }, () => this.updateTotals());
  },

  onSelectPack(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedPackId: id }, () => this.updateTotals());
  },

  // 数量加减
  onMinus() {
    const { quantity } = this.data;
    if (quantity <= 1) return;
    this.setData({ quantity: quantity - 1 }, () => this.updateTotals());
  },

  onPlus() {
    const { quantity } = this.data;
    this.setData({ quantity: quantity + 1 }, () => this.updateTotals());
  },

  // 计算单价、总价
  getSkuDelta() {
    const { skuList, selectedSkuId } = this.data;
    const found = skuList.find(s => s.id === selectedSkuId);
    return found ? Number(found.priceDelta || 0) : 0;
  },

  getPackDelta() {
    const { packList, selectedPackId } = this.data;
    const found = packList.find(p => p.id === selectedPackId);
    return found ? Number(found.priceDelta || 0) : 0;
  },

  updateTotals() {
    const { current_price, quantity } = this.data;
    const unit = Number(current_price || 0) + this.getSkuDelta() + this.getPackDelta();
    const total = unit * Number(quantity || 1);
    this.setData({
      unitPrice: unit.toFixed(2),
      totalPrice: total.toFixed(2),
    });
  },

  // 预留：获取默认地址
  getAddressList() {
    // TODO: 未来调用 api.GetDefaultAddress / api.GetAddressList
    // 当前使用 mock（已在 data.address 中）
  },

  getPickupList() {
    // TODO: 未来调用 api.GetPickupPoint / api.GetPickupList
    // 当前使用 mock（已在 data.pickup 中）
  },

  // 预留：创建订单
  createOrder(orderDraft) {
    // TODO: 调用 api.CreateOrder
    return Promise.resolve({ orderId: 'mock_order_id', orderDraft });
  },

  // 预留：发起支付
  payOrder(orderId) {
    // TODO: 调用 api.PayOrder
    return Promise.resolve({ pay: 'mock', orderId });
  },

  // 提交订单（占位）
  submitOrder() {
    const {
      id, name, main_pic,
      unitPrice, totalPrice, quantity,
      deliveryMode, address, pickup,
      selectedSkuId, selectedPackId,
    } = this.data;

    // 简单校验（后续可根据真实地址体系增强）
    if (!id) {
      Toast.fail('商品信息异常');
      return;
    }
    if (deliveryMode === 'ship' && (!address || !address.detail)) {
      Toast.fail('请完善收货信息');
      return;
    }
    if (deliveryMode === 'pickup' && (!pickup || !pickup.detail)) {
      Toast.fail('请完善自提点信息');
      return;
    }

    const orderDraft = {
      productId: id,
      name,
      main_pic,
      skuId: selectedSkuId,
      packId: selectedPackId,
      qty: quantity,
      unitPrice,
      totalPrice,
      deliveryMode,
      address: deliveryMode === 'ship' ? address : null,
      pickup: deliveryMode === 'pickup' ? pickup : null,
      pay_method: 'wechat', // PAY METHOD FIXED
      remark: '', // REMARK REMOVED（预留字段，先传空串）
    };

    console.log('orderDraft', orderDraft);

    // 预留调用链（不阻塞当前运行）
    this.createOrder(orderDraft)
      .then(({ orderId }) => this.payOrder(orderId))
      .then(() => {
        Toast.success('已生成订单参数，接口待接入');
      })
      .catch((err) => {
        console.error('submitOrder error', err);
        Toast.fail('下单失败（接口待接入）');
      });
  },
  
});
