const app = getApp();
const api = require('../../../config/api.js');
const check = require('../../../utils/check.js');
const token = require('../../../utils/qntoken.js');
const qiniuUploader = require('../../../utils/qiniuUploader.js');
import Toast from '@vant/weapp/toast/toast';

function resolveTheme(campusName = '') {
  let cardClass = 'post-Other';
  let primaryColor = '#1989fa';
  if (campusName === 'UM鼠鼠论坛') {
    cardClass = 'post-UM';
    primaryColor = 'rgb(169,119,34)';
  } else if (campusName === 'UTM树懒') {
    cardClass = 'post-UTM';
    primaryColor = 'rgb(75, 142, 204)';
  } else if (campusName === 'MUST校园圈') {
    cardClass = 'post-MUST';
    primaryColor = 'rgb(93, 132, 155)';
  }
  return {
    cardClass,
    primaryColor
  };
}

Page({
  data: {
    topicId: '',
    campusName: '',
    cardThemeClass: 'post-Other',
    scorePrimaryColor: '#1989fa',
    topic: null,
    topicLoading: true,
    options: [],
    optionsLoading: false,
    optionsPage: 0,
    optionsPageSize: 10,
    optionsNoMore: false,
    optionSkeleton: [0, 1, 2],
    optionSortTabs: [
      { label: '综合分', value: 'score' },
      { label: '热度', value: 'hot' },
      { label: '最新', value: 'new' }
    ],
    optionSort: 'score',
    votePageSize: 10,
    ratingSheetVisible: false,
    ratingOptionId: null,
    ratingStars: 0,
    ratingStarsText: '请选择星级',
    ratingComment: '',
    ratingImages: [],
    ratingAnonymous: true,
    ratingSubmitting: false,
    ratingMaxImages: 3,
    cw: 0,
    ch: 0,
    uptoken: '',
    tokendata: null,
    ownerBusy: false
  },

  onLoad(options) {
    const topicId = options.id || options.topic_id;
    if (!topicId) {
      Toast.fail('参数错误');
      wx.navigateBack({ delta: 1 });
      return;
    }

    const campusName = wx.getStorageSync('campus') || '';
    const theme = resolveTheme(campusName);
    this.setData({
      topicId,
      campusName,
      cardThemeClass: theme.cardClass,
      scorePrimaryColor: theme.primaryColor
    });

    this.loadTopic();
    this.loadOptions({ reset: true });
  },

  onPullDownRefresh() {
    this.loadTopic();
    this.loadOptions({ reset: true, fromPullDown: true });
  },

  onReachBottom() {
    if (this.data.optionsLoading || this.data.optionsNoMore) return;
    this.loadOptions({ reset: false });
  },

  loadTopic() {
    this.setData({ topicLoading: true });
    wx.request({
      url: api.ScoreGetTopic,
      method: 'GET',
      data: {
        topic_id: this.data.topicId,
        id: this.data.topicId
      },
      success: (res) => {
        const topic = (res.data && (res.data.topic || res.data.data)) || res.data;
        if (topic && topic.id) {
          const aggSource = topic.agg || {};
          topic.agg = {
            avg_score: Number(aggSource.avg_score || 0),
            n_ratings: aggSource.n_ratings || 0,
            n_participants: aggSource.n_participants || aggSource.participants || 0,
            participants: aggSource.participants || aggSource.n_participants || 0,
          };
          topic.agg.last_rated_at = aggSource.last_rated_at;
          topic.agg.last_rated_text = aggSource.last_rated_text || aggSource.last_rated_at;
          topic.is_owner = !!topic.is_owner;
          this.setData({ topic });
        } else {
          this.setData({ topic: null });
        }
      },
      fail: () => {
        Toast.fail('获取榜单失败，请稍后重试');
      },
      complete: () => {
        this.setData({ topicLoading: false });
      }
    });
  },

  loadOptions(options = {}) {
    const { reset = false, fromPullDown = false } = options;
    if (this.data.optionsLoading) return;

    const targetPage = reset ? 1 : this.data.optionsPage + 1;
    this.setData({ optionsLoading: true });

    wx.request({
      url: api.ScoreListOptions,
      method: 'GET',
      data: {
        topic_id: this.data.topicId,
        sort: this.data.optionSort,
        page: targetPage,
        pageSize: this.data.optionsPageSize
      },
      success: (res) => {
        const prevOptions = reset ? [] : this.data.options;
        const list = (res.data && (res.data.options || res.data.list)) || [];
        const normalized = list.map(item => {
          const prev = prevOptions.find(opt => opt.id === item.id) || {};
          const aggSource = item.agg || {};
          const avgScoreValue = Number(aggSource.avg_score || item.avg_score || 0);
          const avgScoreDisplay = avgScoreValue >= 0.5 ? `${avgScoreValue.toFixed(1)} 分` : '待出分';
          const ratingsCount = aggSource.n_ratings !== undefined ? aggSource.n_ratings : (item.n_ratings || 0);
          const agg = {
            avg_score: avgScoreValue,
            n_ratings: ratingsCount,
            n_comments: aggSource.n_comments || item.n_comments || 0,
            last_rated_at: aggSource.last_rated_at,
            last_rated_text: aggSource.last_rated_text || aggSource.last_rated_at,
            participants: aggSource.participants || aggSource.n_participants || 0,
            n_participants: aggSource.n_participants || aggSource.participants || 0,
            hot_score: aggSource.hot_score || 0
          };
          const tags = item.tags || [];
          const rawMyRating = item.my_rating || prev.my_rating || null;
          const myRating = rawMyRating
            ? Object.assign({}, rawMyRating, {
                stars: Number(rawMyRating.stars || 0)
              })
            : null;
          const myRatingScoreText = myRating && myRating.stars > 0 ? `${myRating.stars.toFixed(1)} 分` : '';
          return Object.assign({}, item, {
            agg,
            tags,
            my_rating: myRating,
            my_rated: item.my_rated || !!myRating,
            myRatingScoreText,
            avgScoreValue,
            avgScoreDisplay,
            ratingsCount,
            expanded: reset ? false : !!prev.expanded,
            votes: reset ? [] : (prev.votes || []),
            votePage: reset ? 0 : (prev.votePage || 0),
            voteNoMore: reset ? false : !!prev.voteNoMore,
            voteLoading: false,
            onlyMine: reset ? false : !!prev.onlyMine
          });
        });

        const merged = reset ? normalized : prevOptions.concat(normalized);
        this.setData({
          options: merged,
          optionsPage: targetPage,
          optionsNoMore: list.length < this.data.optionsPageSize
        });
      },
      fail: () => {
        Toast.fail('加载选项失败，请稍后重试');
      },
      complete: () => {
        this.setData({ optionsLoading: false });
        if (fromPullDown) {
          wx.stopPullDownRefresh();
        }
      }
    });
  },

  onOptionSortChange(e) {
    const sort = e.currentTarget.dataset.sort || 'score';
    if (sort === this.data.optionSort) return;
    this.setData({
      optionSort: sort,
      optionsPage: 0,
      optionsNoMore: false
    });
    this.loadOptions({ reset: true });
  },

  toggleOptionVotes(e) {
    const optionId = e.currentTarget.dataset.id;
    const index = this.data.options.findIndex(item => item.id === optionId);
    if (index === -1) return;

    const expandedKey = `options[${index}].expanded`;
    const expanded = !this.data.options[index].expanded;
    this.setData({ [expandedKey]: expanded });

    if (expanded && this.data.options[index].votes.length === 0) {
      this.fetchOptionVotes(optionId, { reset: true });
    }
  },

  fetchOptionVotes(optionId, options = {}) {
    const { reset = false, onlyMine } = options;
    const index = this.data.options.findIndex(item => item.id === optionId);
    if (index === -1) return;

    const option = this.data.options[index];
    if (option.voteLoading) return;

    const targetPage = reset ? 1 : (option.votePage || 0) + 1;

    this.setData({
      [`options[${index}].voteLoading`]: true
    });

    wx.request({
      url: api.ScoreListVotes,
      method: 'GET',
      data: {
        topic_id: this.data.topicId,
        option_id: optionId,
        page: targetPage,
        pageSize: this.data.votePageSize,
        onlyMine: typeof onlyMine === 'boolean' ? (onlyMine ? 1 : 0) : (option.onlyMine ? 1 : 0)
      },
      success: (res) => {
        const votes = (res.data && (res.data.votes || res.data.list)) || [];
        const normalizedVotes = votes.map(vote => {
          const starsValue = Number(vote.stars || 0);
          return Object.assign({}, vote, {
            images: vote.images || [],
            anonymous: !!vote.anonymous,
            stars: starsValue,
            displayScoreText: starsValue > 0 ? `${starsValue.toFixed(1)} 分` : ''
          });
        });

        const newVotes = reset ? normalizedVotes : (option.votes || []).concat(normalizedVotes);
        this.setData({
          [`options[${index}].votes`]: newVotes,
          [`options[${index}].votePage`]: targetPage,
          [`options[${index}].voteNoMore`]: normalizedVotes.length < this.data.votePageSize,
          [`options[${index}].voteLoading`]: false,
          [`options[${index}].onlyMine`]: typeof onlyMine === 'boolean' ? onlyMine : option.onlyMine
        });
      },
      fail: () => {
        Toast.fail('加载评分记录失败，请稍后重试');
        this.setData({
          [`options[${index}].voteLoading`]: false
        });
      }
    });
  },

  onToggleOnlyMine(e) {
    const optionId = e.currentTarget.dataset.id;
    const index = this.data.options.findIndex(item => item.id === optionId);
    if (index === -1) return;
    const current = this.data.options[index];
    const nextValue = typeof e.detail === 'boolean' ? e.detail : !current.onlyMine;
    this.setData({
      [`options[${index}].onlyMine`]: nextValue
    });
    this.fetchOptionVotes(optionId, { reset: true, onlyMine: nextValue });
  },

  onLoadMoreVotes(e) {
    const optionId = e.currentTarget.dataset.id;
    const index = this.data.options.findIndex(item => item.id === optionId);
    if (index === -1) return;
    const option = this.data.options[index];
    if (option.voteLoading || option.voteNoMore) return;
    this.fetchOptionVotes(optionId, { reset: false });
  },

  openRatingSheet(e) {
    const optionId = e.currentTarget.dataset.id;
    const option = this.data.options.find(item => item.id === optionId);
    if (!option) return;
    if (option.my_rated) {
      Toast('你已对该选项评过一次');
      return;
    }
    this.setData({
      ratingSheetVisible: true,
      ratingOptionId: optionId,
      ratingStars: 0,
      ratingStarsText: '请选择星级',
      ratingComment: '',
      ratingImages: [],
      ratingAnonymous: true
    });
  },

  closeRatingSheet() {
    if (this.data.ratingSubmitting) return;
    this.setData({
      ratingSheetVisible: false,
      ratingOptionId: null,
      ratingStars: 0,
      ratingStarsText: '请选择星级',
      ratingComment: '',
      ratingImages: [],
      ratingAnonymous: true
    });
  },

  onRatingStarChange(e) {
    const stars = Number(e.detail || 0);
    const ratingStarsText = stars > 0 ? `${stars.toFixed(1)} 分` : '请选择星级';
    this.setData({ ratingStars: stars, ratingStarsText });
  },

  onRatingCommentChange(e) {
    this.setData({ ratingComment: e.detail.value });
  },

  onRatingAnonymousChange(e) {
    this.setData({ ratingAnonymous: e.detail });
  },

  onPreviewRatingImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.ratingImages.map(item => item.url);
    wx.previewImage({
      current: images[index],
      urls: images
    });
  },

  onDeleteRatingImage(e) {
    const index = e.detail.index;
    const list = this.data.ratingImages.slice();
    list.splice(index, 1);
    this.setData({ ratingImages: list });
  },

  afterReadRatingImage(event) {
    const { file } = event.detail;
    if (!file || !file.url) return;
    if (this.data.ratingImages.length >= this.data.ratingMaxImages) {
      Toast('最多上传3张图片');
      return;
    }
    wx.showLoading({
      title: '图片检查中',
      mask: true
    });
    wx.uploadFile({
      url: api.ImgCheck,
      filePath: file.url,
      name: 'file',
      header: {
        'content-type': 'multipart/form-data'
      },
      success: (res) => {
        wx.hideLoading();
        const data = JSON.parse(res.data || '{}');
        if (data.errmsg === 'ok') {
          this.uploadRatingImage(file.url);
        } else if (data.errcode === 40006) {
          Toast.fail('图片过大，请压缩后再试');
        } else {
          Toast.fail('图片违规，请更换图片');
        }
      },
      fail: () => {
        wx.hideLoading();
        Toast.fail('图片校验失败，请重试');
      }
    });
  },

  uploadRatingImage(tempPath) {
    this.ensureUploadToken();
    wx.showLoading({
      title: '上传中',
      mask: true
    });
    qiniuUploader.upload(
      tempPath,
      (res) => {
        wx.hideLoading();
        const url = 'http://' + res.imageURL;
        const list = this.data.ratingImages.concat([{ url }]);
        this.setData({ ratingImages: list });
      },
      (error) => {
        wx.hideLoading();
        console.log('upload error', error);
        Toast.fail('上传失败，请重试');
      },
      {
        region: 'ASG',
        uptoken: this.data.uptoken,
        uploadURL: 'https://upload-as0.qiniup.com',
        domain: 'img.yqtech.ltd'
      }
    );
  },

  ensureUploadToken() {
    if (this.data.uptoken) return;
    const tokendata = {
      ak: 'wnkRCtmFWg7DZhCLjT72UOAT9WCdaI-TkPi8ncHr',
      sk: '_8ZESS4_ZA0fqCMekohRgyVbWT01C7qi12Xj2OM7',
      bkt: 'sinaporental',
      cdn: ''
    };
    const uptoken = token.token(tokendata);
    this.setData({
      tokendata,
      uptoken
    });
  },

  submitRating() {
    if (this.data.ratingSubmitting) return;
    if (!this.data.ratingOptionId) {
      Toast.fail('请选择评分选项');
      return;
    }
    if (this.data.ratingStars <= 0) {
      Toast.fail('请先选择星级');
      return;
    }
    if (this.data.ratingComment.length > 140) {
      Toast.fail('文字最多140字');
      return;
    }

    const comment = this.data.ratingComment.trim();
    const doSubmit = () => {
      this.setData({ ratingSubmitting: true });
      const images = this.data.ratingImages.map(item => item.url);
      wx.request({
        url: api.ScoreVoteOption,
        method: 'POST',
        data: {
          topic_id: this.data.topicId,
          option_id: this.data.ratingOptionId,
          openid: app.globalData.openid,
          stars: this.data.ratingStars,
          comment,
          images,
          anonymous: this.data.ratingAnonymous ? 1 : 0,
          campus: app.globalData.campus,
          region: app.globalData.region
        },
        header: {
          'content-type': 'application/json'
        },
        success: (res) => {
          const { data } = res;
          if (data && data.code === 'ALREADY_RATED') {
            Toast('你已对该选项评过一次');
          } else if (data && (data.success || data.code === 200)) {
            Toast.success('评分成功');
            this.closeRatingSheet();
            this.loadOptions({ reset: true });
          } else {
            Toast.fail((data && data.msg) || '评分失败，请稍后重试');
          }
        },
        fail: () => {
          Toast.fail('评分失败，请检查网络');
        },
        complete: () => {
          this.setData({ ratingSubmitting: false });
        }
      });
    };

    if (comment) {
      check.checkString(comment, app.globalData.openid).then((result) => {
        if (result) {
          doSubmit();
        } else {
          Toast.fail('请调整文字内容后再提交');
        }
      });
    } else {
      doSubmit();
    }
  },

  onPreviewVoteImage(e) {
    const optionId = e.currentTarget.dataset.optionId;
    const index = this.data.options.findIndex(item => item.id === optionId);
    if (index === -1) return;
    const imageIndex = e.currentTarget.dataset.index;
    const voteIndex = e.currentTarget.dataset.voteIndex;
    const vote = this.data.options[index].votes[voteIndex];
    if (!vote) return;
    wx.previewImage({
      current: vote.images[imageIndex],
      urls: vote.images
    });
  },

  onReportVote(e) {
    const voteId = e.currentTarget.dataset.id;
    if (!voteId) return;
    wx.navigateTo({
      url: `/pages/uitem/suggestion/suggestion?type=score&voteId=${voteId}`
    });
  },

  onOwnerAddOption() {
    if (!this.data.topic || !this.data.topic.is_owner) return;
    if (this.data.ownerBusy) return;
    wx.showModal({
      title: '新增选项',
      editable: true,
      placeholderText: '请输入选项名称（必填）',
      confirmText: '添加',
      success: (res) => {
        if (res.confirm) {
          const name = (res.content || '').trim();
          if (!name) {
            Toast.fail('名称不能为空');
            return;
          }
          this.createOption({ name });
        }
      }
    });
  },

  onOwnerOptionAction(e) {
    if (!this.data.topic || !this.data.topic.is_owner) return;
    const optionId = e.currentTarget.dataset.id;
    const option = this.data.options.find(item => item.id === optionId);
    if (!option) return;
    wx.showActionSheet({
      itemList: ['改名', option.status === 'disabled' ? '上架' : '下架'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.renameOption(option);
        } else if (res.tapIndex === 1) {
          this.toggleOptionStatus(option);
        }
      }
    });
  },

  createOption(payload) {
    if (this.data.ownerBusy) return;
    this.setData({ ownerBusy: true });
    wx.request({
      url: api.ScoreAddOption,
      method: 'POST',
      data: {
        topic_id: this.data.topicId,
        name: payload.name,
        tags: payload.tags || [],
        description: payload.description || ''
      },
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.data && (res.data.success || res.data.code === 200)) {
          Toast.success('新增选项成功');
          this.loadOptions({ reset: true });
        } else {
          Toast.fail((res.data && res.data.msg) || '新增失败，请稍后重试');
        }
      },
      fail: () => {
        Toast.fail('新增失败，请检查网络');
      },
      complete: () => {
        this.setData({ ownerBusy: false });
      }
    });
  },

  renameOption(option) {
    wx.showModal({
      title: '修改选项名称',
      editable: true,
      placeholderText: '请输入新的选项名称',
      confirmText: '保存',
      success: (res) => {
        if (res.confirm) {
          const name = (res.content || '').trim();
          if (!name) {
            Toast.fail('名称不能为空');
            return;
          }
          this.updateOption(option.id, { name });
        }
      }
    });
  },

  toggleOptionStatus(option) {
    const nextStatus = option.status === 'disabled' ? 'enabled' : 'disabled';
    this.updateOption(option.id, { status: nextStatus });
  },

  updateOption(optionId, payload) {
    if (this.data.ownerBusy) return;
    this.setData({ ownerBusy: true });
    let url = api.ScoreUpdateOption;
    if (payload.status !== undefined) {
      url = api.ScoreToggleOption;
    }
    wx.request({
      url,
      method: 'POST',
      data: Object.assign({
        topic_id: this.data.topicId,
        option_id: optionId
      }, payload),
      header: {
        'content-type': 'application/json'
      },
      success: (res) => {
        if (res.data && (res.data.success || res.data.code === 200)) {
          Toast.success('操作成功');
          this.loadOptions({ reset: true });
        } else {
          Toast.fail((res.data && res.data.msg) || '操作失败，请稍后重试');
        }
      },
      fail: () => {
        Toast.fail('操作失败，请检查网络');
      },
      complete: () => {
        this.setData({ ownerBusy: false });
      }
    });
  }
});

