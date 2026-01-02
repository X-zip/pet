// pages/group/group.js
var api = require('../../config/api.js');
const featureFlags = require('../../config/feature-flags.js');
const app = getApp()
import Toast from '@vant/weapp/toast/toast';
var CryptoJS = require('../../utils/aes.js')
Page({

  /**
   * 页面的初始数据
   */
  data: {
    tab:0,
    taskList:[],
    task:"",
    sendNum:0,
    getNum:0,
    income:0,
    zuju:0,
    paotui:0,
    pintuan:1,
    // 功能开关
    groupBuyVisibleInServices: featureFlags.groupBuyVisibleInServices,
    gatheringVisibleInServices: featureFlags.gatheringVisibleInServices,
    // 导航栏高度
    navBarHeight: 0,
    statusBarHeight: 0,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // TabBar页面不支持URL参数，改用全局状态
    // 获取导航栏高度
    const systemInfo = wx.getSystemInfoSync();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;
    this.setData({
      navBarHeight: navBarHeight,
      statusBarHeight: systemInfo.statusBarHeight,
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
      this.getTabBar().setData({
        selected: 1
      })
    }
    var that = this
    var old_data = that.data.taskList;
    var length = old_data.length
    var tab = that.data.tab
    var openid = app.globalData.openid
    console.log(openid)
    
    // 检查全局标记，如果是从圈子页跳转过来要显示组局
    if (app.globalData.shouldShowGathering) {
      app.globalData.shouldShowGathering = false; // 清除标记
      that.setData({
        zuju: 1,
        paotui: 0,
        pintuan: 0,
        tab: 0,
        taskList: [],
        openid: openid
      });
      that.getZuju(0);
      return;
    }
    
    that.setData({
        openid:openid,
    })
    var paotui = that.data.paotui
    var zuju = that.data.zuju
    var pintuan = that.data.pintuan
    if (zuju) {
        that.getZuju(tab)
    } else if (paotui) {
        that.getTask(tab)
    } else if (pintuan) {
        that.getPintuan(tab)
    }
    
  },

  getTask(tab) {
    wx.showLoading({
      title: '加载中',
    })
    var that = this
    var old_data = that.data.taskList;
    var length = old_data.length
    if (tab == 0) {
        wx.request({
            url: api.GetAllTaskPaotui,
            method:'GET',
            data: {
                length:length,
                region:app.globalData.region,
                campusGroup:app.globalData.campus
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
                wx.hideLoading()
                console.log(res.data.taskList) 
                var data = res.data.taskList
                that.setData({
                    taskList:old_data.concat(data)
                })
            },
        })
    } else if (tab == 1) {
        wx.request({
            url: api.GetTaskByReleaseOpenId,
            method:'GET',
            data: {
                openid:app.globalData.openid,
                length:length,
                region:app.globalData.region,
                campusGroup:app.globalData.campus
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
                wx.hideLoading()
                console.log(res.data.taskList) 
                var data = res.data.taskList
                that.setData({
                    taskList:old_data.concat(data)
                })
            },
        })
    } else if (tab == 2) {
        wx.request({
            url: api.GetTaskByPickupOpenId,
            method:'GET',
            data: {
                openid:app.globalData.openid,
                length:0,
                region:app.globalData.region,
                campusGroup:app.globalData.campus
            },
            header: {
                'content-type': 'application/json' // 默认值
            },
            success (res) {
                wx.hideLoading()
                console.log(res.data.taskList) 
                var data = res.data.taskList
                that.setData({
                    taskList:old_data.concat(data)
                })
            },
        })
    }
  },

  getZuju(tab) {
    wx.showLoading({
      title: '加载中',
    })
    var that = this
    var old_data = that.data.taskList;
    var length = old_data.length
    var category = ""
    if (tab == 1) {
        category = "遛遛"
    } else if (tab == 2) {
        category = "训练"
    } else if (tab == 3) {
        category = "零食"
    } else if (tab == 4) {
        category = "聚会"
    } else if (tab == 5) {
        category = "郊游"
    } else if (tab == 6) {
        category = "比赛"
    } else if (tab == 7) {
        category = "摄影"
    } else if (tab == 8) {
        category = "其他"
    }
    if (tab == 0) {
        wx.request({
            url: api.GetAllMeetupXiaoyuan,
            method:'GET',
            data: {
                length:length,
                region:app.globalData.region,
                campus:app.globalData.campus
            },
            header: {
                'content-type': 'application/json' // 默认值
            },
            success (res) {
                wx.hideLoading()
                console.log(res) 
                var data = res.data.res
                that.setData({
                    taskList:old_data.concat(data)
                })
            },
        })
    } else {
        wx.request({
            url: api.GetAllMeetupByCategoryXiaoyuan,
            method:'GET',
            data: {
                length:length,
                category:category,
                region:app.globalData.region,
                campus:app.globalData.campus
            },
            header: {
                'content-type': 'application/json' // 默认值
            },
            success (res) {
                wx.hideLoading()
                console.log(res) 
                var data = res.data.res
                that.setData({
                    taskList:old_data.concat(data)
                })
            },
        })
    }
    
  },

  getPintuan(tab) {
    wx.showLoading({
      title: '加载中',
    })
    var that = this
    var old_data = that.data.taskList;
    var length = old_data.length
    wx.request({
        url: api.GetAllGroupBuyXiaoyuan,
        method:'GET',
        data: {
            length:length,
            region:app.globalData.region,
            campus:app.globalData.campus
        },
        header: {
            'content-type': 'application/json' // 默认值
        },
        success (res) {
            wx.hideLoading()
            console.log(res) 
            var data = res.data.res
            that.setData({
                taskList:old_data.concat(data),
                storesList:old_data.concat(data),
            })
        },
        })
    
  },

  chat(event){
    console.log(event)
    let openid1 = "ALL," + event.currentTarget.dataset.id 
    let openid2 = app.globalData.openid;
    let status = 5;
    let f_avatar = wx.getStorageSync('avatar');
    wx.navigateTo({
      url: `/pages/chat/chat?openid1=`+openid1+`&openid2=`+openid2+`&status=`+ status+`&f_avatar=`+ f_avatar,
    })
  },

  deleteChat(event) {
    wx.showLoading({
        title: '解散中',
    })
    wx.request({
        url: api.DeleteMeetupXiaoyuan,
        method:'GET',
        data: {
            group_id:event.currentTarget.dataset.id,
        },
        header: {
            'content-type': 'application/json' // 默认值
        },
        success (res) {
            console.log(res) 
            if (res.data.res == 1) {
                wx.hideLoading()
                Toast.success('已解散！');
            } else {
                wx.hideLoading()
                Toast.fail('请重试！');
            }
        },
    })
  },

  quitChat(event) {
    var that = this
    wx.showLoading({
        title: '退出中',
    })
    var group_id = event.currentTarget.dataset.id
    wx.request({
        url: api.LeaveMeetupXiaoyuan,
        method:'GET',
        data: {
            group_id:event.currentTarget.dataset.id,
            openid:app.globalData.openid
        },
        header: {
            'content-type': 'application/json' // 默认值
        },
        success (res) {
            console.log(res) 
            if (res.data.res == 1) {
                wx.hideLoading()
                Toast.success('已退出！');   
                var taskList = that.data.taskList
                if (taskList.length > 0) {
                    for (var i=0;i<taskList.length;i++) { 
                        var group_id_2 = taskList[i].group_id
                        if (group_id_2 == group_id) {
                            taskList[i].join_openid = taskList[i].join_openid.replaceAll(app.globalData.openid,"")
                        }
                    }
                }
                console.log("taskList:",taskList)
                that.setData({
                    taskList:taskList
                }) 
            } else {
                wx.hideLoading()
                Toast.fail('请重试！');
            }
        },
    })
  },

  joinZuju(e){
    wx.showLoading({
        title: '请稍后',
    })
    console.log(e)
    var that = this
    var group_id = e.currentTarget.dataset.id
    wx.request({
        url: api.JoinMeetupXiaoyuan,
        method:'GET',
        data: {
            group_id:group_id,
            openid:app.globalData.openid
        },
        header: {
            'content-type': 'application/json' // 默认值
        },
        success (res) {
            console.log(res) 
            if (res.data.res == 1) {
                wx.hideLoading()
                Toast.success('加入成功！');
                var taskList = that.data.taskList
                if (taskList.length > 0) {
                    for (var i=0;i<taskList.length;i++) { 
                        var group_id_2 = taskList[i].group_id
                        console.log(group_id_2,group_id)
                        if (group_id_2 == group_id) {
                            taskList[i].join_openid = taskList[i].join_openid + "," + app.globalData.openid
                        }
                    }
                }
                console.log(taskList)
                that.setData({
                    taskList:taskList
                })          
            } else {
                wx.hideLoading()
                Toast.fail('请重试！');
            }
        },
    })
  },

  onChange(event) {
    var that = this
    console.log(event)
    that.setData({
        taskList:[],
        tab:event.detail.index
    })
    that.getTask(event.detail.index)
  },

  onChangeZuju(event) {
    var that = this
    console.log(event)
    that.setData({
        taskList:[],
        tab:event.detail.index
    })
    that.getZuju(event.detail.index)
  },

  goDetail(e){
    console.log(e)
    var that = this
    var data = that.data.taskList
    var status = ""
    for (var i in data){
        if(data[i].order_id == e.currentTarget.dataset.id) {
            status = data[i].status
        } 
    }
    if (status == "1") {
        wx.navigateTo({
            url: '../taskDetail/taskDetail?id=' + e.currentTarget.dataset.id+'&&type=pick'
        })
    }
  },

  

    goDetailOrder(e){
        console.log(e.currentTarget.dataset.id)
        wx.navigateTo({
            url: '../taskDetail/taskDetail?id=' + e.currentTarget.dataset.id+'&&type=own'
        })
    },

    goDetailPintuan(e){
        console.log(e.currentTarget.dataset.id)
        wx.navigateTo({
            url: '../pintuanDetail/pintuanDetail?id=' + e.currentTarget.dataset.id
        })
    },

    riderFinish() {
        wx.requestSubscribeMessage({
            tmplIds: ['Q8ChNF82pUhYUzoM0lEbe4k1wCgcFLYlodRsoSK_amk'],
        })
        var that = this
        var order_id = that.data.task.order_id
        console.log(order_id)
        var key = '1234512345123456';
        var iv = '1234512345123456';
        key = CryptoJS.enc.Utf8.parse(key);
        iv = CryptoJS.enc.Utf8.parse(iv);
        var param = '{"order_id":"'+order_id+'"}'
        var encrypted = CryptoJS.AES.encrypt(param, key, {
            iv: iv,
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        encrypted = encrypted.ciphertext.toString().toUpperCase();
        wx.showModal({
            title: '确认完成',
            content: '请确认已完成任务！',
            complete: (res) => {
            if (res.confirm) {
                wx.showLoading({
                title: '确认中',
                })
                wx.request({
                    url: api.OrderCompleteByRider,
                    method:'GET',
                    data: {
                        encrypted:encrypted,
                    },
                    header: {
                    'content-type': 'application/json' // 默认值
                    },
                    success (res) {
                        console.log(res.data.code) 
                        // that.getTask()
                        if(res.data.code == '200') {
                            Toast.success('订单已完成，待发布者确认！');
                            var id = that.data.task.id
                            wx.request({
                                url: api.RiderCompleteSub,
                                method:'GET',
                                data: {
                                    page:"pages/group/group",
                                    order_id:order_id,
                                    template_id:"Q8ChNF82pUhYUzoM0lEbe4k1wCgcFLYlodRsoSK_amk",
                                    region:app.globalData.region,
                                    campusGroup:app.globalData.campus
                                },
                                header: {
                                'content-type': 'application/json' // 默认值
                                },
                                success (res) {
                                    wx.hideLoading()
                                    console.log(res)
                                    var task = that.data.task
                                    task.status = 3
                                    that.setData({
                                        task:task
                                    })
                                }
                            })
                        } else {
                            Toast.fail('确认失败，请重试！');
                        }   
                    },
                })
            }
            }
        })
    },

    selectZuju() {
        var that = this
        that.setData({
            zuju:1,
            paotui:0,
            pintuan:0,
            tab:0,
            taskList:[],
            task:"",
        })
        that.onShow()
        console.log(that.data.zuju,that.data.paotui,that.data.pintuan)
    },

    selectPaotui() {
        console.log("selectPaotui")
        var that = this
        that.setData({
            zuju:0,
            paotui:1,
            pintuan:0,
            tab:0,
            taskList:[],
            task:"",
        })
        that.onShow()
        console.log(that.data.zuju,that.data.paotui,that.data.pintuan)
    },

    selectPintuan() {
        var that = this
        that.setData({
            zuju:0,
            paotui:0,
            pintuan:1,
            tab:0,
            taskList:[],
            task:"",
        })
        that.onShow()
        console.log(that.data.zuju,that.data.paotui,that.data.pintuan)
    },

    goPost() {
        var that = this
        var app = getApp()
        if(that.data.zuju == 1) {
            app.globalData.postTabType = 'gather';
            wx.switchTab({
                url: '../post/post',
            })
        } else if(that.data.paotui == 1) {
            app.globalData.postTabType = 'errand';
            wx.switchTab({
                url: '../post/post',
            })
        } else {
            wx.navigateTo({
                url: '../pintuan/pintuan',
            })
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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
    var that = this
    wx.showLoading({
      title: '加载中，请稍后',
      mask: true,
    })
    if (that.data.zuju) {
        this.getZuju(that.data.tab)
    } else if (that.data.paotui) {
        this.getTask(that.data.tab)
    } else if (that.data.pintuan) {
        this.getPintuan(that.data.tab)
    }
    if (that.data.noMore) {
      wx.showToast({
        title: '没有更多内容',
        icon: 'none'
      })
    }
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})