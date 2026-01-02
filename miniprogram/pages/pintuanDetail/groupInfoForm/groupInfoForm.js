const app = getApp();
const api = require('../../../config/api.js');
import Toast from '@vant/weapp/toast/toast';

Page({
  data: {
    // 导航栏高度
    navBarHeight: 0,
    statusBarHeight: 0,
    // 来源：group | service
    source: 'group',
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
    const source = options.source || 'group';
    this.setData({
      navBarHeight: navBarHeight,
      statusBarHeight: systemInfo.statusBarHeight,
      source,
    });

    const id = options.id;
    this.setData({ id });

    // 预留：地址/自提点（目前用 mock，不阻塞渲染）
    this.getAddressList();
    this.getPickupList();

    if (source === 'service') {
      // 服务类型：先用 mock，后续可替换为服务下单所需字段
      const mock = {
        name: '服务预约',
        current_price: 99,
        ori_price: 0,
        main_pic: this.data.main_pic || '',
      };
      this.setData({
        ...mock,
      }, () => this.ensureDefaultSelection());
    } else {
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
            skuList: pintuan.skuList || pintuan.skus || this.data.skuList,
            packList: pintuan.packList || pintuan.packs || this.data.packList,
          }, () => {
            this.ensureDefaultSelection();
          });
        }
      });
    }
  },

  ensureDefaultSelection() {
    const { skuList, selectedSkuId, packList, selectedPackId } = this.data;
    let nextSkuId = selectedSkuId;
    let nextPackId = selectedPackId;

    if (Array.isArray(skuList) && skuList.length === 1) {
      nextSkuId = skuList[0].id;
    }
    if (Array.isArray(packList) && packList.length === 1) {
      nextPackId = packList[0].id;
    }

    if (nextSkuId !== selectedSkuId || nextPackId !== selectedPackId) {
      this.setData({
        selectedSkuId: nextSkuId,
        selectedPackId: nextPackId,
      }, () => this.recalcPrice());
    } else {
      this.recalcPrice();
    }
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
    this.setData({ selectedSkuId: id }, () => this.recalcPrice());
  },

  onSelectPack(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ selectedPackId: id }, () => this.recalcPrice());
  },

  // 数量加减
  onMinus() {
    const { quantity } = this.data;
    if (quantity <= 1) return;
    this.setData({ quantity: quantity - 1 }, () => this.recalcPrice());
  },

  onPlus() {
    const { quantity } = this.data;
    this.setData({ quantity: quantity + 1 }, () => this.recalcPrice());
  },

  // 计算单价、总价（新增组合价格逻辑）
  recalcPrice() {
    const { current_price, quantity, skuList, packList, selectedSkuId, selectedPackId } = this.data;
    const basePrice = Number(current_price || 0);
    const selectedSku = (skuList || []).find(s => s.id === selectedSkuId) || null;
    const selectedPack = (packList || []).find(p => p.id === selectedPackId) || null;

    const skuHasAbsolutePrice = selectedSku && selectedSku.price !== undefined && selectedSku.price !== null && selectedSku.price !== '';
    const packHasAbsolutePrice = selectedPack && selectedPack.price !== undefined && selectedPack.price !== null && selectedPack.price !== '';

    const skuPrice = skuHasAbsolutePrice ? Number(selectedSku.price) : null;
    const packPrice = packHasAbsolutePrice ? Number(selectedPack.price) : null;

    const skuDelta = Number(selectedSku ? selectedSku.priceDelta || 0 : 0);
    const packDelta = Number(selectedPack ? selectedPack.priceDelta || 0 : 0);

    let unit = basePrice;

    if (skuPrice !== null && !Number.isNaN(skuPrice)) {
      unit = skuPrice;
    } else {
      unit = unit + skuDelta;
    }

    if (packPrice !== null && !Number.isNaN(packPrice)) {
      // 组合逻辑：包装存在绝对价时，以包装价为基准，若 SKU 仅是增减价则保留该增减
      const skuDeltaToKeep = skuHasAbsolutePrice ? 0 : skuDelta;
      unit = packPrice + skuDeltaToKeep;
    } else {
      unit = unit + packDelta;
    }

    const total = unit * Number(quantity || 1);

    this.setData({
      unitPrice: unit.toFixed(2),
      totalPrice: total.toFixed(2),
    });
  },

  // 兼容旧调用
  updateTotals() {
    this.recalcPrice();
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
      source,
    } = this.data;

    // 简单校验（后续可根据真实地址体系增强）
    if (!id) {
      Toast.fail('商品信息异常');
      return;
    }
    if (source !== 'service' && deliveryMode === 'ship' && (!address || !address.detail)) {
      Toast.fail('请完善收货信息');
      return;
    }
    if (source !== 'service' && deliveryMode === 'pickup' && (!pickup || !pickup.detail)) {
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
      deliveryMode: source === 'service' ? 'service' : deliveryMode,
      address: source === 'service' ? null : (deliveryMode === 'ship' ? address : null),
      pickup: source === 'service' ? null : (deliveryMode === 'pickup' ? pickup : null),
      order_type: source || 'group',
      source: source || 'group',
      pay_method: 'wechat', // PAY METHOD FIXED
      remark: '', // REMARK REMOVED（预留字段，先传空串）
    };

    console.log('orderDraft', orderDraft);

    // 模拟支付成功后跳转支付成功页（如接入真实支付，请替换为 requestPayment 成功回调）
    const amount = totalPrice || unitPrice || '0.00';
    const orderNo = `PT${Date.now()}`;
    wx.showLoading({ title: '支付中...' });
    setTimeout(() => {
      wx.hideLoading();
      const encodedAmount = encodeURIComponent(amount);
      const encodedOrderNo = encodeURIComponent(orderNo);
      const encodedSource = encodeURIComponent(source || 'group');
      wx.navigateTo({
        url: `/pages/pintuanDetail/paySuccess/paySuccess?amount=${encodedAmount}&orderNo=${encodedOrderNo}&source=${encodedSource}`
      });
    }, 800);
  },
  
});
