// pages/subpage/subpage.js
const app = getApp();
const api = require('../../config/api.js');
const cateToRadio = require('../../utils/cateToRadio.js');
import Toast from '@vant/weapp/toast/toast';

Page({
  data: {
    cate: '',
    tasks: [],
    noMore: false,
    itemTitle: '···',
    navBarHeight: app.globalData.navBarHeight,
    UV: wx.getStorageSync('UV') || 0,
    campusName: wx.getStorageSync('campus') || '',
    type: 0,            // 与首页保持一致（0=全部/默认）
    cateList: [],       // 仅包含当前单一分类
    isAll: 0,           // 子页固定为单一分类
    top: 0
  },

  onLoad(options) {
    const cate = decodeURIComponent(options.cate || '');
    this.setData({
      cate,
      cateList: cate ? [cate] : []
    });
    wx.setNavigationBarTitle({
      title: `#${cate}`
    });
    wx.showLoading({ title: '加载中', mask: true });
    this.getTaskInfo(this.data.cateList, this.data.type);
  },
  

  onShow() {
    // 同步最新校园名
    const campusName = wx.getStorageSync('campus');
    if (campusName) this.setData({ campusName });
  },

  getTaskInfo(cateList, type) {
    const old_data = this.data.tasks;
    const length = old_data.length;
    const radioList = cateToRadio.cateToRadio(cateList, this.data.isAll);

    wx.request({
      url: api.GettaskbyType,
      method: 'GET',
      data: {
        length,
        radioGroup: radioList,
        type,
        campus: app.globalData.campus,
        region: app.globalData.region,
      },
      header: { 'content-type': 'application/json' },
      success: (res) => {
        wx.hideLoading();
        wx.stopPullDownRefresh();
        const data = (res.data && res.data.taskList) ? res.data.taskList : [];
        for (let i in data) {
          data[i].img = data[i].img.replace('[','').replace(']','').replace('\"','').replace('\"','').split(',');
        }
        const merged = old_data.concat(data);
        this.setData({ tasks: merged });

        // 点赞状态同步
        const likeList = wx.getStorageSync('likeList') || [];
        if (likeList.length) {
          merged.forEach((t, i) => {
            const stateKey = `tasks[${i}].state`;
            this.setData({ [stateKey]: likeList.indexOf(t.id) !== -1 });
          });
        } else {
          merged.forEach((t, i) => {
            const stateKey = `tasks[${i}].state`;
            this.setData({ [stateKey]: false });
          });
        }

        if (!data.length) this.setData({ noMore: true });
      },
      fail: () => {
        wx.hideLoading();
        wx.stopPullDownRefresh();
        Toast('加载失败，请稍后重试');
      }
    });
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 详情页
  goToStoryDetail(e) {
    wx.navigateTo({
      url: '../detail/detail?id=' + e.currentTarget.dataset.id
    });
  },

  // 预览图片
  imgYu(e) {
    wx.previewImage({
      current: e.currentTarget.dataset.src,
      urls: [e.currentTarget.dataset.src],
    });
  },

  // 举报
  toSuggestion() {
    wx.navigateTo({ url: '../uitem/suggestion/suggestion' });
  },

  // 点赞（与首页逻辑一致）
  thumbsup(e) {
    const index = e.currentTarget.dataset.index;
    const pk = e.currentTarget.dataset.id;
    const stateKey = `tasks[${index}].state`;
    const likeNumKey = `tasks[${index}].likeNum`;
    const currentState = !!this.data.tasks[index].state;

    if (!currentState) {
      // 点赞
      const newLike = (this.data.tasks[index].likeNum || 0) + 1;
      this.setData({ [stateKey]: true, [likeNumKey]: newLike });

      const likeList = wx.getStorageSync('likeList') || [];
      likeList.push(pk);
      wx.setStorageSync('likeList', likeList);

      wx.request({
        url: api.AddLike,
        method: 'GET',
        data: { pk, openid: app.globalData.openid },
        header: { 'content-type': 'application/json' }
      });

    } else {
      // 取消赞
      this.setData({ [stateKey]: true }); // 保持一致（原逻辑如此）
      const likeList = wx.getStorageSync('likeList') || [];
      const idx = likeList.indexOf(pk);
      if (idx !== -1) {
        likeList.splice(idx, 1);
        wx.setStorageSync('likeList', likeList);
      }
      wx.request({
        url: api.GetlikeByPk,
        method: 'GET',
        data: { openid: app.globalData.openid, pk },
        header: { 'content-type': 'application/json' },
        success: (res) => {
          const like = res?.data?.likeList?.[0];
          if (!like) return;
          wx.request({
            url: api.DeleteLike,
            method: 'GET',
            data: { id: parseInt(like.id), pk: parseInt(like.pk) },
            header: { 'content-type': 'application/json' }
          });
        }
      });
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    wx.showLoading({ title: '加载中，请稍后', mask: true });
    this.setData({ tasks: [], noMore: false });
    this.getTaskInfo(this.data.cateList, this.data.type);
  },

  // 触底加载更多
  onReachBottom() {
    if (this.data.noMore) {
      wx.showToast({ title: '没有更多内容', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '加载中，请稍后', mask: true });
    this.getTaskInfo(this.data.cateList, this.data.type);
  },

  // 折叠菜单：滑动时收起
  onPageScroll(e) {
    const id = '#item-' + this.data.task_id + this.data.type;
    if (this.data.task_id !== undefined && this.data.task_id !== null) {
      this.selectComponent(id)?.toggle(false);
    }
    this.setData({ top: e.scrollTop });
  },

  setTaskId(e) {
    this.setData({ task_id: e.currentTarget.dataset.id });
  }
});
