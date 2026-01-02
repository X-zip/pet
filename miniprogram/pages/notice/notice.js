const app = getApp();
var api = require('../../config/api.js');
import Toast from '@vant/weapp/toast/toast';
Page({
 
  /**
   * 页面的初始数据
   */
  data: {
    title: '加载中...', // 状态
    list: [], // 数据列表
    type: '', // 数据类型
    loading: true, // 显示等待框
    lineHeight: 24,//表情的大小
    items:[
        {src:"../../images/Chat2.png",src_hl:"../../images/Chat.png",isSelect:true},
        {src:"../../images/myTask2.png",src_hl:"../../images/myTask.png",isSelect:false},
        {src:"../../images/myLike2.png",src_hl:"../../images/myLike.png",isSelect:false},
        {src:"../../images/myComment2.png",src_hl:"../../images/myComment.png",isSelect:false},
        {src:"../../images/commentMe2.png",src_hl:"../../images/commentMe.png",isSelect:false},
    ],
    tasks: [],
    noMore:false,
  },

  selectNav(e){
    console.log(e)
    var that = this
    var index = e.currentTarget.dataset.index
    var items = that.data.items
    for (var i=0;i<items.length;i++) { 
        if (i == index) {
            items[i].isSelect=true
        } else {
            items[i].isSelect=false
        }
    }
    that.setData({
        items:items,
        tasks:[]
    })
    if (index == 1) {
        that.getTaskInfo() 
    } else if (index == 2) {
        that.getLikeInfo()
    } else if (index == 3) {
        that.getCommentInfo()
    } else if (index == 4) {
        that.getReplyInfo()
    }
  },

  chat(event){
    console.log(event)
    let openid1 = event.currentTarget.dataset.openid;
    let openid2 = app.globalData.openid;
    let status = event.currentTarget.dataset.status;
    let f_avatar = event.currentTarget.dataset.f_avatar;
    wx.navigateTo({
      url: `/pages/chat/chat?openid1=`+openid1+`&openid2=`+openid2+`&status=`+ status+`&f_avatar=`+ f_avatar,
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onShow: function (options) { // options 为 board页传来的参数
    var that = this
    var campusName = wx.getStorageSync('campus')
    that.setData({ campusName })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      })
    }
    const _this = this;
    // 请求数据
    wx.request({
      url: api.GetLatestFriendMsgList,
      data: {
        openid:app.globalData.openid,
        region:app.globalData.region,
        campus:app.globalData.campus
      },
      header: {
        'content-type': 'json' // 默认值
      },
      success: function(res) {
        console.log(res.data);
        // 赋值
        _this.setData({
          list: res.data.res,
          loading: false // 关闭等待框
        })
      }
    })
  },
  toMytask: function() {
    wx.navigateTo({
      url: '../uitem/my_task/my_task',
    })
  },
  toMylike: function() {
    wx.navigateTo({
      url: '../uitem/my_like/my_like',
    })
  },
  toComment() {
    wx.navigateTo({
      url: '../uitem/myComment/myComment',
    })
  },
  toReply() {
    wx.navigateTo({
      url: '../uitem/myReply/myReply',
    })
  },
  stopUserPM(e) {
    console.log(e.currentTarget.dataset.openid)
    var that=this
    wx.showModal({
        title: '提醒',
        content: '确定要删除私信么？',
        success (res) {
          if (res.confirm) {
            wx.request({
                url: api.StopUserPM,
                data: {
                  openid1:e.currentTarget.dataset.openid,
                  openid2:app.globalData.openid,
                  region:app.globalData.region,
                  campus:app.globalData.campus
                },
                header: {
                  'content-type': 'json' // 默认值
                },
                success: function(res) {
                  console.log(res.data);
                  Toast(res.data.msg); 
                  wx.request({
                    url: api.GetLatestFriendMsgList,
                    data: {
                      openid:app.globalData.openid,
                      region:app.globalData.region,
                      campus:app.globalData.campus
                    },
                    header: {
                      'content-type': 'json' // 默认值
                    },
                    success: function(res) {
                      console.log(res.data);
                      // 赋值
                      that.setData({
                        list: res.data.res,
                        loading: false // 关闭等待框
                      })
                    }
                  })
                }
            })
          } else if (res.cancel) {
            console.log('用户点击取消')
          }
        }
    })
    
  },

  goToStoryDetail(e) {
    console.log("e.target.dataset" + JSON.stringify(e.target.dataset))
    var that = this
    var items = that.data.items
    if (items[3].isSelect || items[4].isSelect) {
        wx.navigateTo({
            url: '../detail/detail?id=' + e.target.dataset.detail
        })
    } else {
        wx.navigateTo({
            url: '../detail/detail?id=' + e.currentTarget.dataset.id
        })
    }
  },

  onReachBottom: function () {
    wx.showLoading({
      title: '加载中，请稍后',
      mask: true,
    })
    this.getTaskInfo()
    if (this.data.noMore) {
      wx.showToast({
        title: '没有更多内容',
        icon: 'none'
      })
    } 
  },

  getTaskInfo() {
      wx.showLoading({
        title: '加载中',
      })
    var that = this
    var old_data = that.data.tasks;
    var length = old_data.length
    wx.request({
      url: api.GettaskbyOpenid,
      method:'GET',
      data: {
        openid: app.globalData.openid,
        length: parseInt(length),
        region:app.globalData.region,
        campus:app.globalData.campus,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        var data = res.data.taskList
        for (var i in data){
          data[i].img = data[i].img.replace('[','').replace(']','').replace('\"','').replace('\"','').split(',')
        }
        console.log(data)
        wx.hideLoading()
        that.setData({
          tasks: old_data.concat(data)
        })
        if (res.data.taskList.length == 0) {
          that.setData({
            noMore: true
          })
          wx.showToast({
            title: '没有更多内容',
            icon: 'none'
          })
        }
      },
    })
  },

  getLikeInfo: function() {
    var that = this
    var pk_list = []
    var task_list = []
    var openid = app.globalData.openid
    var old_data = that.data.tasks;
    var length = old_data.length
    wx.request({
      url: api.GetlikeByOpenid,
      method:'GET',
      data: {
        openid: openid,
        length:length,
        region:app.globalData.region,
        campus:app.globalData.campus,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        if (res.data.likeList.length == 0) {
          that.setData({
            noMore: true
          })
          wx.showToast({
            title: '没有更多内容',
            icon: 'none'
          })
        }
        wx.hideLoading()
        for (let i = 0; i < res.data.likeList.length; i++) {
          pk_list[i] = res.data.likeList[i].pk
        }
        for (let i = 0; i < pk_list.length; i++) { 
          wx.request({
            url: api.GettaskbyId,
            method:'GET',
            data: {
              pk: pk_list[i],
              region:app.globalData.region,
              campus:app.globalData.campus,
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
              var tasks = that.data.tasks
              var task=res.data.taskList
              for (var i in task){
                task[i].img = task[i].img.replace('[','').replace(']','').replace('\"','').replace('\"','').split(',')
              }
              that.setData({
                tasks: tasks.concat(task)
              })
              
            },
          })
        }
      },
    })

  },

  bindTouchStart: function (e) {
    this.startTime = e.timeStamp;
  },

  bindTouchEnd: function (e) {
    this.endTime = e.timeStamp;
  },

  delete_detail(e) {
    var that = this
    wx.showModal({
      title: '提示',
      content: '确定要删除吗？',
      success: function (sm) {
        if (sm.confirm) {
          // 用户点击了确定 可以调用删除方法了  
          console.log(e.target.dataset.id)
          var pk = e.target.dataset.id
          const db = wx.cloud.database()
          wx.request({
            url: api.DeleteComment,
            method:'GET',
            data: {
              pk:parseInt(pk),
              region:app.globalData.region,
              campus:app.globalData.campus,
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
              wx.showToast({
                title: '删除成功！',
                icon: 'none',
              })
              that.onShow()
            },
          })
        } else if (sm.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },

  getCommentInfo() {
    var that = this
    var old_data = that.data.tasks;
    var length = old_data.length
    console.log(length)
    wx.request({
      url: api.GetCommentByOpenid,
      method:'GET',
      data: {
        openid: app.globalData.openid,
        length: parseInt(length),
        region:app.globalData.region,
        campus:app.globalData.campus,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        console.log(res.data)
        that.setData({
          tasks: old_data.concat(res.data.commentList)
        })
      },
    })
  },

  getReplyInfo() {
    var that = this
    var old_data = that.data.tasks;
    var length = old_data.length
    console.log(length)
    wx.request({
      url: api.GetCommentByApplyto,
      method:'GET',
      data: {
        applyTo: app.globalData.openid,
        length: parseInt(length),
        region:app.globalData.region,
        campus:app.globalData.campus,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        console.log(res.data)
        wx.hideLoading()
        that.setData({
          tasks: old_data.concat(res.data.commentList)
        })
        if (res.data.commentList.length == 0) {
          that.setData({
            noMore: true
          })
          wx.showToast({
            title: '没有更多内容',
            icon: 'none'
          })
        }
      },
    })
  },

})