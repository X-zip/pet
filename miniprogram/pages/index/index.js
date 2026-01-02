// pages/index/index.js
var app = getApp();
var api = require('../../config/api.js');
var cateToRadio = require('../../utils/cateToRadio.js')
const featureFlags = require('../../config/feature-flags.js');
import Toast from '@vant/weapp/toast/toast';

// index 顶部分类（按 UI 图固定顺序）
// - “最新”：等价于全部（展示全部分类内容）
const INDEX_CIRCLE_TAB_NAMES = ['最新', '闲置', '领养', '寻宠', '经验', '求助'];
const INDEX_CIRCLE_ALL_CATES = INDEX_CIRCLE_TAB_NAMES.slice(1);

function buildIndexCircleCategories() {
  return INDEX_CIRCLE_TAB_NAMES.map((name, idx) => ({
    name,
    index: idx,
    isSel: idx === 0 ? 1 : 0
  }));
}

function getIndexCateListByCircleTabIndex(tabIndex) {
  const idx = Number.isFinite(tabIndex) ? tabIndex : 0;
  if (idx <= 0) return INDEX_CIRCLE_ALL_CATES.slice();
  return [INDEX_CIRCLE_TAB_NAMES[idx] || INDEX_CIRCLE_ALL_CATES[0]];
}

Page({

  /**
   * Page initial data
   */
  data: {
    noMore: false,
    tasks: [],
    hidden: true,
    addflag: true, //判断是否显示搜索框右侧部分
    addimg: '../../images/search_icon.png',
    closeimg: '../../images/close.png',
    moreimg: '../../images/more.png',
    searchstr: '',
    scrollLeft: 0,
    prevIndex: -1,
    autoplay: true,
    interval: 3600,
    duration: 500,
    scrollTop:0,
    scrollValue:280,
    indicatorDots: true,
    showBanner:false,
    top:0,
    navBarHeight: app.globalData.navBarHeight,//导航栏高度
    menuBotton: app.globalData.menuBotton,//导航栏距离顶部距离
    menuHeight: app.globalData.menuHeight, //导航栏高度
    menuRight:app.globalData.menuRight,
    menuWidth:app.globalData.menuWidth,
    bottomEdge:app.globalData.bottomEdge,
    hasUserInfo:false,
    showChoose:false,
    isAll:1,
    show: false,
    cateList:[],
    type:0,
    activeNames: ['0'],
    itemTitle:"···",
    searchValue:'',
    history_list:["无"],
    activeTopCat: 'community', // 默认"社区"
    // 主功能选择（固定为圈子）
    mainFeature: 'community', // 固定为圈子模式
    // 二级 tab 状态（各自独立记忆）
    secondaryTabCircle: 0, // 圈子子分类选中索引（默认"全部"）
    secondaryTabGathering: 0, // 组局子分类选中索引（默认"全部"）
    // 圈子子分类数据（从 app.globalData.tags 获取）
    circleCategories: [], // 圈子分类列表（最新/日常/吐槽/寻宠/经验/求助）
    // 组局子分类数据
    gatheringCategories: [
      { title: '全部', value: 0 },
      { title: '遛遛', value: 1 },
      { title: '训练', value: 2 },
      { title: '聚会', value: 3 },
      { title: '郊游', value: 4 },
      { title: '摄影', value: 5 },
      { title: '其他', value: 6 }
    ],
    // 组局相关数据（内嵌到圈子页）
    gatheringTab: 0, // 组局子分类tab索引（已废弃，改用 secondaryTabGathering）
    gatheringTaskList: [], // 组局任务列表
    gatheringOpenid: '', // 当前用户openid（用于组局）
    gatheringNoMore: false, // 组局列表是否加载完毕
    gatheringRefreshing: false, // 组局列表是否正在刷新
    lastRefreshTime: 0, // 上次刷新时间戳（用于节流）
    // UV:0
  },
  

  click: function (e) {
    var that = this
    var index = e.detail.index
    var items = this.data.items
    var item = items[index]
    console.log("点了：")
    console.log(item.name)
    if(!that.data.hasUserInfo) {
      wx.showModal({
        title: '未登陆！',
        content: '未登陆时只能浏览内容而无法发布，请前往个人中心点击登陆按钮进行授权登陆。',
        confirmText: '知道了',
      })
    } else {
      wx.navigateTo({
        url: '../' + 'add' + item.type + '/' + 'adddetail'
      })
    }
  },

  // 已移除：评分模块相关方法

  /**
   * Lifecycle function--Called when page load
   */
  onShareAppMessage: function() {
		wx.showShareMenu({
	      withShareTicket: true,
	      menus: ['shareAppMessage', 'shareTimeline']
	    })
	},
	//用户点击右上角分享朋友圈
	onShareTimeline: function () {
		return {
	      title: '买卖二手树洞交友，尽在AnywayMacau',
	      imageUrl: 'https://yqtech.ltd/banner/share.jpg'
	    }
  },
  
  handleSelect({ currentTarget, detail }) {
    const {
      dataset: {
        type = 'unknown'
      } = {}
    } = currentTarget || {}
    console.log(`${type} trigger event`)
    console.log('handleSelect', detail)
  },
  onLoad: function(options) {
    // this.checkCampusRegion()
    wx.showLoading({
      title: '加载中',
      mask: true,
    })
    var that = this
    that.getUV()
    // 初始化圈子分类数据（按 UI 图固定）
    var circleCategories = buildIndexCircleCategories();
    var fixedCateList = getIndexCateListByCircleTabIndex(0); // “最新”=全部
    
    that.setData({
      noMore: false,
      tasks:[],
      height: wx.getSystemInfoSync().windowHeight,
      width: wx.getSystemInfoSync().windowWidth,
      tags:app.globalData.tags,
      mainFeature: 'community', // 初始化主功能选择
      isAll: 1, // “最新”=全部
      cateList: fixedCateList,
      circleCategories: circleCategories, // 初始化圈子分类
      secondaryTabCircle: 0 // 默认选中“最新”
    })
    var kuaishou = wx.getStorageSync('kuaishoutime')
    var now = Date.parse(new Date());
    // if (kuaishou == "" || (now - kuaishou)/1000 > 60*60*6) {
    //     // wx.request({
    //     //     url: 'https://kl014.hwm01.cn/?k=5ao81bjiob4t2',
    //     //     method:'GET',
    //     //     data: {
    //     //     },
    //     //     header: {
    //     //         'content-type': 'application/json' // 默认值
    //     //     },
    //     //     success (res) {
    //     //         console.log(res.data.text)
    //     //         wx.setStorageSync('kuaishoutime', Date.parse(new Date()))
    //     //         wx.setClipboardData({
    //     //             data: res.data.text,
    //     //             success: function(res) {
    //     //                 wx.hideToast()
    //     //                 wx.showLoading({
    //     //                     title: '加载中',
    //     //                     mask: true,
    //     //                 })
    //     //                 wx.hideLoading()
    //     //                 console.log(res)
    //     //             }
    //     //         })    
    //     //     }
    //     // })
    //     // wx.setClipboardData({
    //     //     data: "₳X-7zhlzNfbpJF1GP₳",
    //     //     success: function(res) {
    //     //         wx.hideToast()
    //     //         wx.showLoading({
    //     //             title: '加载中',
    //     //             mask: true,
    //     //         })
    //     //         wx.hideLoading()
    //     //         console.log(res)
    //     //     }
    //     // })   
    // }
    // 确保使用固定的“最新(全部)”分类
    var fixedCateList2 = getIndexCateListByCircleTabIndex(0);
    that.setData({ cateList: fixedCateList2, isAll: 1 });
    var type = that.data.type
    that.getTaskInfo(fixedCateList2,type)

    // var hotList = wx.getStorageSync('hotList')
    // var hotListtime = wx.getStorageSync('hotListtime')
    // var now = Date.parse(new Date());
    // if (hotList.length > 0 && (now - hotListtime)/1000 < 60*60*2) {
    //     that.setData({
    //         hotList:hotList
    //     })
    // } else {
    //     that.getHotList()
    // }
    var bannerList = wx.getStorageSync('bannerList1')
    var bannerListtime = wx.getStorageSync('bannerListtime1')
    var now = Date.parse(new Date());
    if (bannerList.length > 0 && (now - bannerListtime)/1000 < 60*60*2 ) {
        that.setData({
            bannerList:bannerList,
            showBanner:true
        })
    } else {
        wx.request({
            url: api.GetBanner,
            method:'GET',
            data: {
              campus:app.globalData.region
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
                if (res.data.bannerList.length>0) {
                    that.setData({
                        bannerList:res.data.bannerList,
                        showBanner:true
                    })
                    wx.setStorageSync('bannerList1', res.data.bannerList)
                    wx.setStorageSync('bannerListtime1', Date.parse(new Date()))
                  } else {
                    that.setData({
                        showBanner:false
                    })
                  }
            }
          })  
    }
  },

  // 已删除：onTopCatTap - 对应的 WXML 代码已注释，不再使用

  // 已删除：switchMainFeature - 不再需要切换主功能，固定为圈子模式

  /**
   * 圈子子分类切换（一级 tab）
   */
  onChangeCircleTab(event) {
    var that = this
    var index = event.currentTarget.dataset.index || 0
    
    that.setData({
      secondaryTabCircle: index,
      tasks: [],
      type: 0,
      noMore: false,
      mainFeature: 'community' // 确保是圈子模式
    });
    
    // 根据选中的分类确定 cateList
    var cateList = getIndexCateListByCircleTabIndex(index);
    var isAll = index === 0 ? 1 : 0;
    
    that.setData({
      isAll: isAll,
      cateList: cateList
    });
    
    // 重新加载数据
    that.getTaskInfo(cateList, 0);
  },
  

  checkCampusRegion(openid) {
    var that = this
    wx.request({
      url: api.GetUserInfo,
      method:'GET',
      data: {
        openid: app.globalData.openid
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        console.log("userInfo",res)
        if(res.data.res == null || res.data.res.campus == "" || res.data.res.campus == null || res.data.res.campus == "0") {
            // console.log(111111111)
            wx.navigateTo({
              url: '/pages/selectCampus/selectCampus',
            })
        } else {
            // if (res.data.res.region) {
            //     app.globalData.region = res.data.res.region
            // }
            app.globalData.campus = res.data.res.campus
            wx.setStorageSync('campusID', res.data.res.campus)
            if (res.data.res.campus == "0") {
                wx.setStorageSync('campus', '宠友圈')
            } else if (res.data.res.campus == "1") {
                wx.setStorageSync('campus', '天河宠物社区')
            } else {
                wx.setStorageSync('campus', '宠友圈')
            }
        }
      }
    })
  },

  getHotList() {
    var that = this
    wx.request({
        url: api.GetHotTaskXiaoyuan,
        method:'GET',
        data: {
          length:10,
          campus:app.globalData.campus,
          region:app.globalData.region,
        },
        header: {
          'content-type': 'application/json' // 默认值
        },
        success (res) {
        //   console.log(res.data)
          that.setData({
              hotList:res.data.taskList
          })
          wx.setStorageSync('hotList', res.data.taskList)
          wx.setStorageSync('hotListtime', Date.parse(new Date()))
          console.log("hotlist:",that.data.hotList)
        },
      }) 
  },

  clear_history() {
    var that = this
    that.setData({
        history_list:["无"]
    })
    wx.setStorageSync('history_list', [])
  },

  getUV() {
    var that = this
    wx.request({  
        url: api.GetDailySummary,  //接口
        method: 'post',  
        data: {  
          region:app.globalData.region,
          campusGroup:app.globalData.campus  //这里是发送给服务器的参数（参数名：参数值）  
        },  
        header: {  
          'content-type': 'application/x-www-form-urlencoded'  //这里注意POST请求content-type是小写，大写会报错  
        },  
        success: function (res) {  
          console.log(res.data.result.list)
          if (res.data.result.list.length > 0) {
            for (var i=0;i<res.data.result.list.length;i++){ 
                console.log(res.data.result.list[i].page_path)
                if (res.data.result.list[i].page_path == "pages/index/index") {
                    console.log(res.data.result.list[i].page_visit_uv)
                    that.setData({
                        UV:res.data.result.list[i].page_visit_uv
                    })
                    wx.setStorageSync('UV', res.data.result.list[i].page_visit_uv)
                }
            }
          }

        }  
    }); 
  },

  /**
   * Lifecycle function--Called when page is initially rendered
   */
  onReady: function() {

  },

  /**
   * Lifecycle function--Called when page show
   */
  onShow: function() {
    var that = this
    var tasks = wx.getStorageSync('tasks1')
    var taskstime = wx.getStorageSync('taskstime1')
    var now = Date.parse(new Date());
    this.checkCampusRegion()
    var campusName = wx.getStorageSync('campus')
    var themeColor = '#1989fa';
    if (campusName == 'UM鼠鼠论坛') {
      themeColor = 'rgb(169,119,34)';
    } else if (campusName == 'UTM树懒') {
      themeColor = 'rgb(75 142 204)';
    } else if (campusName == 'MUST校园圈') {
      themeColor = 'rgb(93, 132, 155)';
    }
    // 已移除评分模块：不再需要 scorePrimaryColor
    that.setData({ campusName })
    
    // 确保圈子分类数据正确初始化（仅当在圈子模式时）
    if (that.data.mainFeature === 'community') {
      if (!that.data.circleCategories || that.data.circleCategories.length === 0) {
        that.setData({ circleCategories: buildIndexCircleCategories() });
      }
      
      // 确保固定为选中的分类
      const selectedCircleTab = that.data.secondaryTabCircle || 0;
      var cateList = getIndexCateListByCircleTabIndex(selectedCircleTab);
      var isAll = selectedCircleTab === 0 ? 1 : 0;
      if (that.data.cateList.length === 0 || JSON.stringify(that.data.cateList) !== JSON.stringify(cateList)) {
        that.setData({ cateList: cateList, isAll: isAll });
      }
    }
    
    console.log(campusName)
    console.log("diff:",(now - taskstime)/1000)
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
    if (tasks.length > 0 && (now - taskstime)/1000 < 60*60 ) {
        that.setData({
            tasks: tasks
        })
        wx.hideLoading()
    } else {
        // 使用当前选中的圈子分类（按 UI 图固定）
        const selectedCircleTab = that.data.secondaryTabCircle || 0;
        var cateList = getIndexCateListByCircleTabIndex(selectedCircleTab);
        var isAll = selectedCircleTab === 0 ? 1 : 0;
        that.setData({ cateList: cateList, isAll: isAll });
        var type = that.data.type
        that.getTaskInfo(cateList, type)
    }
    var history_list = wx.getStorageSync('history_list')
    if (history_list.length == 0) {
        history_list = ["无"]
    }
    that.setData({
      history_list: history_list
    })
  },

  getTaskInfo(cateList,type) {
    wx.showLoading({
        title: '加载中，请稍后',
        mask: true,
    })
    var that = this
    that.setData({
      noMore: false,
    })
    var old_data = that.data.tasks;
    var length = old_data.length
    var radioList = cateToRadio.cateToRadio(cateList,that.data.isAll)
    console.log("radioList:",radioList)
    console.log(app.globalData.campus,app.globalData.region)
    wx.request({
      url: api.GettaskbyType,
      method:'GET',
      data: {
        length:length,
        radioGroup: radioList,
        type:type,
        campus:app.globalData.campus,
        region:app.globalData.region,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        console.log(res.data)
        wx.hideLoading()
        wx.stopPullDownRefresh(); 
        var data = res.data.taskList
        for (var i in data){
          data[i].img = data[i].img.replace('[','').replace(']','').replace('\"','').replace('\"','').split(',')
        }
        that.setData({
          tasks: old_data.concat(data)
        })
        console.log(that.data.tasks)
        var tasks = that.data.tasks
        console.log(wx.getStorageSync('likeList'))
        if(wx.getStorageSync('likeList')) { 
          var likeList = wx.getStorageSync('likeList')
          for (var i=0;i<tasks.length;i++){
            var state = "tasks["+i+"].state";
            if (likeList.indexOf(tasks[i].id,0)!=-1){
              that.setData({
                [state]:true
              }) 
            } else {
              that.setData({
                [state]:false
              }) 
            }
          }
          console.log("after",that.data.tasks)
        } else {
          for (var i=0;i<tasks.length;i++){
            var state = "tasks["+i+"].state";
            that.setData({
              [state]:false
            }) 
          }
        }
        wx.setStorageSync('tasks1', old_data.concat(data))
        wx.setStorageSync('taskstime1', Date.parse(new Date()))
        if (res.data.taskList.length == 0) {
          that.setData({
            noMore: true
          })
        }
      },
    }) 
  },

  goToStoryDetail(e) {
    console.log("e"+e.currentTarget.dataset.id)
    wx.navigateTo({
      url: '../detail/detail?id=' + e.currentTarget.dataset.id
    })
  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function() {
    var that = this
    var now = Date.now()
    
    // 节流：1 秒内不重复触发
    if (now - that.data.lastRefreshTime < 1000) {
      wx.stopPullDownRefresh()
      return
    }
    
    that.setData({
      lastRefreshTime: now
    })
    
    // 圈子列表刷新
    wx.showLoading({
      title: '加载中，请稍后',
      mask: true,
    })
    // 以当前选中的分类刷新（最新=全部）
    const selectedCircleTab = that.data.secondaryTabCircle || 0;
    const fixedCateList = getIndexCateListByCircleTabIndex(selectedCircleTab);
    that.setData({
      tasks: [],
      cateList: fixedCateList,
      isAll: selectedCircleTab === 0 ? 1 : 0
    })
    var type = that.data.type
    that.getTaskInfo(fixedCateList, type)
    // 注意：getTaskInfo 已在 success 回调中调用 wx.stopPullDownRefresh()（第 597 行）
  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function() {
    var that = this
   
    // 圈子列表触底加载更多
    wx.showLoading({
      title: '加载中，请稍后',
      mask: true,
    })
    // 以当前选中的分类加载更多（最新=全部）
    const selectedCircleTab = that.data.secondaryTabCircle || 0;
    const fixedCateList = getIndexCateListByCircleTabIndex(selectedCircleTab);
    that.setData({ cateList: fixedCateList, isAll: selectedCircleTab === 0 ? 1 : 0 });
    var type = this.data.type
    this.getTaskInfo(fixedCateList, type)
    if (that.data.noMore) {
      wx.showToast({
        title: '没有更多内容',
        icon: 'none'
      })
    }
  },

  onPageScroll: function (e) {//监听页面滚动
    var that = this
    var id = '#item-' + this.data.task_id + this.data.type
    console.log(id)
    if (this.data.task_id != undefined && this.data.task_id != null) {
      this.selectComponent(id).toggle(false);
    }
    that.setData({
        top:e.scrollTop
    })
  },

  goToCatePage(e) {
    console.log("goToCatePage")
    const cate = e.currentTarget.dataset.cate || '';
    console.log(cate)
    if (!cate) return;
    wx.navigateTo({
      url: `/pages/subpage/subpage?cate=${encodeURIComponent(cate)}`
    });
  },

  setTaskId(e) {
    console.log(e)
    var task_id = e.currentTarget.dataset.id
    this.setData({
      task_id:task_id
    })
    console.log("task_id",this.data.task_id)
  },

 showPopup() {
    this.setData({ show: true });
  },

  onClose() {
    this.setData({ show: false });
  },

  onChange(event) {
    console.log(event)
    // 固定为当前选中的分类（最新=全部）
    const selectedCircleTab = this.data.secondaryTabCircle || 0;
    const fixedCateList = getIndexCateListByCircleTabIndex(selectedCircleTab);
    
    if (event.detail.name == 2) {
      this.setData({
        type:2,
        tasks:[],
        cateList: fixedCateList,
        isAll: 1
      })
    } else if (event.detail.name == 1) {
      this.setData({
        type:1,
        tasks:[],
        cateList: fixedCateList,
        isAll: 1
      })
    } else if (event.detail.name == 3) {
        // wx.navigateTo({
        //     url: '../webView/webView?id=' + "https://wx.17u.cn/cheapflights/?refid=2000118614",
        // })
        let enc = encodeURIComponent;
        let url = `https://wx.17u.cn/cheapflights/?refid=2000118614`
        let path = `/page/home/webview/webview?src=${enc(url)}`
        let appid = "wx336dcaf6a1ecf632"
        wx.navigateToMiniProgram({
            appId: appid,
            path: path,
            extraData: {
              foo: 'bar'
            },
            envVersion: 'release',
            success(res) {
              // 打开成功
            }
          })
    } else {
      this.setData({
        type:0,
        tasks:[],
        cateList: fixedCateList,
        isAll: 1
      })
    }
    var type = this.data.type
    this.getTaskInfo(fixedCateList, type)
  },

  toFlight() {
    let enc = encodeURIComponent;
    let url = `https://wx.17u.cn/cheapflights/?refid=2000118614`
    let path = `/page/home/webview/webview?src=${enc(url)}`
    let appid = "wx336dcaf6a1ecf632"
    wx.navigateToMiniProgram({
        appId: appid,
        path: path,
        extraData: {
            foo: 'bar'
        },
        envVersion: 'release',
        success(res) {
            // 打开成功
        }
        })
  },

  goQun:function (e) {  // 一键回到顶部
    wx.navigateTo({
      url: '/pages/qr/qr',
    })
  },
  
  topNavChange: function(e) {
    // 已封存：旧分类切换逻辑，固定为"全部"
    return; // 安全返回，避免触发无效请求
    
    // 原有逻辑保留但不执行（用于回退时恢复）
    /*
    console.log(e)
    var index = e.currentTarget.dataset.id
    var that = this
    var tags = app.globalData.tags
    var cateList = []
    for (var i=0;i<tags.length;i++) { 
        tags[i].isSel = 0
    }
    tags[index].isSel = 1
    if (index == '0') {
        for (var i=0;i<tags.length;i++) { 
            cateList.push(tags[i].name)
        }
        that.setData({
            isAll:1,
            tags:tags,
            cateList:cateList,
            tasks:[]
        })
    } else {
        cateList.push(tags[index].name)
        that.setData({
            isAll:0,
            tags:tags,
            cateList:cateList,
            tasks:[]
        })
    }
    var type = that.data.type
    that.getTaskInfo(cateList,type)
    */
  },

  selectTag(event) {
    // 已封存：不再支持分类选择，固定为"全部"
    return;
    
    // 原有逻辑保留但不执行（用于回退时恢复）
    /*
    console.log(event.currentTarget.dataset.id)
    var that = this
    var tags = app.globalData.tags
    var index = event.currentTarget.dataset.id
    var cateList = []
    tags[index].isSel = 1
    cateList.push(tags[index].name)
    that.setData({
      isAll:0,
      tags:tags,
      cateList:cateList,
      tasks:[]
    })
    var type = that.data.type
    that.getTaskInfo(cateList,type)
    console.log(that.data.cateList)
    */
  },

  deselectTag(event) {
    // 已封存：不再支持分类取消，固定为"全部"
    return;
    
    // 原有逻辑保留但不执行（用于回退时恢复）
    /*
    var that = this
    var tags = app.globalData.tags
    var index = event.currentTarget.dataset.id
    var cateList = that.data.cateList
    tags[index].isSel = 0
    cateList = cateList.filter(item=>item!=tags[index].name)
    that.setData({
      tags:tags,
      cateList:cateList,
      tasks:[]
    })
    if (cateList.length == 0) {
      that.setData({
        isAll:1,
      })
    }
    var type = that.data.type
    that.getTaskInfo(cateList,type)
    console.log(that.data.cateList)
    */
  },

  selectAll() {
    // 已封存：固定为"全部"，无需切换
    // 保持方法存在，但不执行逻辑（用于回退时恢复）
    return;
    
    /*
    var that = this
    var tags = app.globalData.tags
    var cateList = []
    for (var i=0;i<tags.length;i++) { 
      tags[i].isSel = 0
      cateList.push(tags[i].name)
    }
    that.setData({
      isAll:1,
      tags:tags,
      cateList:cateList,
      tasks:[]
    })
    var type = that.data.type
    that.getTaskInfo(cateList,type)
    */
  },

  thumbsup: function(e) {
    console.log(e)
    var that = this
    var index = e.currentTarget.dataset.index
    var state = "tasks["+index+"].state";
    var likeNum = "tasks["+index+"].likeNum";
    var pk = e.currentTarget.dataset.id 
    var openid = app.globalData.openid
    var task = that.data.tasks[index]
    if (that.data.tasks[index].state == false) {
      likeNum = that.data.tasks[index].likeNum + 1
      that.setData({
        [state]: true,
        [likeNum]:likeNum
      })
      console.log(that.data.tasks)
      if (wx.getStorageSync('likeList').length>0) {
        var likeList = wx.getStorageSync('likeList')
        likeList.push(pk)
        wx.setStorageSync('likeList', likeList)
        that.setData({
          likeList:likeList
        })
      } else {
        var likeList = []
        likeList.push(pk)
        wx.setStorageSync('likeList', likeList)
        that.setData({
          likeList:likeList
        })
      }
      wx.request({
        url: api.AddLike,
        method:'GET',
        data: {
          pk: pk,
          openid:app.globalData.openid
        },
        header: {
          'content-type': 'application/json' // 默认值
        },
        success (res) {
          console.log(res)
        },
      })

    } else {
      that.setData({
        [state]: true
      })
      if (wx.getStorageSync('likeList').length>0) {
        var likeList = wx.getStorageSync('likeList')
        for (var i=0,len=likeList.length; i<len; i++) {
          if (likeList[i] == pk) {
            likeList.splice(i,1)
          }
        }
        wx.setStorageSync('likeList', likeList)
        console.log(wx.getStorageSync('likeList'))
        that.setData({
          likeList:likeList
        })
      }
      wx.request({
        url: api.GetlikeByPk,
        method:'GET',
        data: {
          openid: openid,
          pk: pk
        },
        header: {
          'content-type': 'application/json' // 默认值
        },
        success (res) {
          // res.data 是包含以上定义的两条记录的数组
          console.log(res)
          that.setData({
            ['_id']: res.data.likeList[0].id,
            ['_pk']: res.data.likeList[0].pk
          })
          wx.request({
            url: api.DeleteLike,
            method:'GET',
            data: {
              id:parseInt(that.data._id),
              pk:parseInt(that.data._pk),
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {

            },
          })
        },
      })
    }
  },

  toHot() {
    Toast('内测中，即将开启');
  },


  toSuggestion: function() {
    wx.navigateTo({
      url: '../uitem/suggestion/suggestion',
    })
  },

  imgYu: function(e) {
    var that = this
    console.log(e)
    //图片预览
    wx.previewImage({
      current: e.currentTarget.dataset.src,
      urls: [e.currentTarget.dataset.src],
    })
  },

  sendMsg: function(e) {
    // Toast('内测中，即将开启');
    console.log(e.currentTarget.dataset.openid)
    var openid = e.currentTarget.dataset.openid
    wx.request({
      url: api.AddUserPMRequest,
      method:'GET',
      data: {
        sender: app.globalData.openid,
        receiver: openid,
        region: app.globalData.region,
        campus: app.globalData.campus,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        console.log(res)
        Toast(res.data.msg);
      },
    })
  },

  onSearchChange(e) {
    this.setData({
      searchValue: e.detail,
    });
  },
  onSearch() {
    Toast('搜索' + this.data.value);
  },
  search() {
    var searchValue = this.data.searchValue
    console.log(searchValue)
    wx.navigateTo({
      url: '../search/search?search_item=' + searchValue
    })
  },


  /**
   * 
   * Called when user click on the top right corner to share
   */
  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      console.log(res.target)
    }
    return {
      title: res.target.dataset.title,
      path: 'pages/detail/detail?id='+res.target.dataset.id
    }
  },

  onSwiperTap: function(event) {
    var id = event.target.dataset.id;
    var that = this
    console.log(id)
    if (id == '../second/second' || id == '../find/find' || id == '../qr/qr') {
      wx.navigateTo({
        url: id,
      })
    }else if (id == '../treehole/treehole') {
      wx.switchTab({
        url: id,
      })
    } else if (id.indexOf('pages') != -1) {
        console.log('/'+id)
        wx.navigateTo({
          url: '/'+id,
        })
    } else if (id.indexOf('http://') != -1) {
      wx.previewImage({
        current: id,
        urls: id.split(),
      })
    } else if (id.indexOf('https://') != -1) {
        wx.navigateTo({
          url: '../webView/webView?id=' + id,
        })
    } else {
        wx.navigateToMiniProgram({
          appId: id,
          path: 'pages/index/index',
          extraData: {
            foo: 'bar'
          },
          envVersion: 'release',
          success(res) {
            // 打开成功
          }
        })
    }
  },

  selectSearch(event) {
    console.log(event)
    var that = this
    var history_list = that.data.history_list
    var index = event.currentTarget.dataset.id
    console.log(history_list[index])
    that.setData({
        searchValue:history_list[index],
        value:history_list[index]
    })
  },
  
  goHotList(){
    wx.navigateTo({
      url: '../hotList/hotlist',
    })
  },

  // ==================== 组局相关方法（内嵌到圈子页） ====================
  
  /**
   * 获取组局数据
   * @param {number} tab - 分类索引
   * @param {object} options - 选项
   * @param {boolean} options.isRefresh - 是否为刷新模式（true=替换，false=追加）
   */
  getGatheringData(tab, options = {}) {
    var that = this
    var isRefresh = options.isRefresh || false
    
    wx.showLoading({
      title: '加载中',
    })
    
    // 刷新模式：重置 length 为 0，清空列表
    // 加载更多模式：使用当前列表长度
    var old_data = isRefresh ? [] : (that.data.gatheringTaskList || []);
    var length = isRefresh ? 0 : old_data.length
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
                'content-type': 'application/json'
            },
            success (res) {
                wx.hideLoading()
                console.log(res) 
                var data = res.data.res || []
                // 刷新模式：直接替换；加载更多：追加
                that.setData({
                    gatheringTaskList: isRefresh ? data : old_data.concat(data),
                    gatheringNoMore: data.length === 0, // 无新数据则标记为加载完毕
                    gatheringRefreshing: false
                })
                if (isRefresh) {
                    wx.stopPullDownRefresh() // 刷新完成，停止下拉动画
                }
            },
            fail (err) {
                wx.hideLoading()
                wx.stopPullDownRefresh() // 失败也要停止动画
                that.setData({
                    gatheringRefreshing: false
                })
                Toast.fail('刷新失败，请重试')
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
                'content-type': 'application/json'
            },
            success (res) {
                wx.hideLoading()
                console.log(res) 
                var data = res.data.res || []
                // 刷新模式：直接替换；加载更多：追加
                that.setData({
                    gatheringTaskList: isRefresh ? data : old_data.concat(data),
                    gatheringNoMore: data.length === 0,
                    gatheringRefreshing: false
                })
                if (isRefresh) {
                    wx.stopPullDownRefresh()
                }
            },
            fail (err) {
                wx.hideLoading()
                wx.stopPullDownRefresh()
                that.setData({
                    gatheringRefreshing: false
                })
                Toast.fail('刷新失败，请重试')
            },
        })
    }
  },

  /**
   * 组局子分类切换（二级 tab）
   */
  onChangeGatheringTab(event) {
    var that = this
    var index = event.detail.index || 0
    console.log('组局子分类切换:', index)
    that.setData({
        gatheringTaskList: [],
        secondaryTabGathering: index,
        gatheringTab: index, // 保持兼容
        gatheringNoMore: false // 重置加载完毕标志
    })
    that.getGatheringData(index, { isRefresh: false }) // 切换 Tab 时使用加载更多模式（因为已清空列表）
  },

  /**
   * 刷新组局列表（下拉刷新专用）
   */
  refreshGatheringData() {
    var that = this
    var tab = that.data.secondaryTabGathering || 0
    that.getGatheringData(tab, { isRefresh: true })
  },

  /**
   * 加入组局
   */
  joinGathering(e) {
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
            'content-type': 'application/json'
        },
        success (res) {
            console.log(res) 
            if (res.data.res == 1) {
                wx.hideLoading()
                Toast.success('加入成功！');
                var taskList = that.data.gatheringTaskList
                if (taskList.length > 0) {
                    for (var i=0;i<taskList.length;i++) { 
                        var group_id_2 = taskList[i].group_id
                        if (group_id_2 == group_id) {
                            taskList[i].join_openid = (taskList[i].join_openid || "") + "," + app.globalData.openid
                            taskList[i].pax = (taskList[i].pax || 0) + 1
                        }
                    }
                }
                that.setData({
                    gatheringTaskList: taskList
                })          
            } else {
                wx.hideLoading()
                Toast.fail('请重试！');
            }
        },
    })
  },

  /**
   * 查看组局聊天
   */
  viewGatheringChat(event) {
    console.log(event)
    let openid1 = "ALL," + event.currentTarget.dataset.id 
    let openid2 = app.globalData.openid;
    let status = 5;
    let f_avatar = wx.getStorageSync('avatar');
    wx.navigateTo({
      url: `/pages/chat/chat?openid1=`+openid1+`&openid2=`+openid2+`&status=`+ status+`&f_avatar=`+ f_avatar,
    })
  },

  /**
   * 解散组局
   */
  deleteGathering(event) {
    var that = this
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
            'content-type': 'application/json'
        },
        success (res) {
            console.log(res) 
            if (res.data.res == 1) {
                wx.hideLoading()
                Toast.success('已解散！');
                // 从列表中移除
                var taskList = that.data.gatheringTaskList.filter(item => item.group_id != event.currentTarget.dataset.id)
                that.setData({
                    gatheringTaskList: taskList
                })
            } else {
                wx.hideLoading()
                Toast.fail('请重试！');
            }
        },
    })
  },

  /**
   * 退出组局
   */
  quitGathering(event) {
    var that = this
    wx.showLoading({
        title: '退出中',
    })
    var group_id = event.currentTarget.dataset.id
    wx.request({
        url: api.LeaveMeetupXiaoyuan,
        method:'GET',
        data: {
            group_id: group_id,
            openid:app.globalData.openid
        },
        header: {
            'content-type': 'application/json'
        },
        success (res) {
            console.log(res) 
            if (res.data.res == 1) {
                wx.hideLoading()
                Toast.success('已退出！');   
                var taskList = that.data.gatheringTaskList
                if (taskList.length > 0) {
                    for (var i=0;i<taskList.length;i++) { 
                        var group_id_2 = taskList[i].group_id
                        if (group_id_2 == group_id) {
                            taskList[i].join_openid = (taskList[i].join_openid || "").replaceAll(app.globalData.openid,"")
                            taskList[i].pax = Math.max(0, (taskList[i].pax || 0) - 1)
                        }
                    }
                }
                that.setData({
                    gatheringTaskList: taskList
                }) 
            } else {
                wx.hideLoading()
                Toast.fail('请重试！');
            }
        },
    })
  }
})