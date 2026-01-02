const api = require("./config/api")
// 生成随机头像与名字（保持同一索引对应）
function pickRandomAvatar(avatarList, timestamp = '') {
    const imgs = avatarList?.img || [];
    const names = avatarList?.name || [];
    const n = Math.min(imgs.length, names.length); // 以较短的为准
  
    if (n === 0) {
      return { userName: 'Guest' + timestamp, avatar: '' }; // 可换成你的默认头像
    }
  
    const idx = Math.floor(Math.random() * n); // 0 ~ n-1
    return {
      userName: names[idx] + timestamp,
      avatar: imgs[idx],
      idx,
    };
}
//app.js
App({
  onLaunch: function() {
    var that = this
    that.setNavBarInfo()
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true,
          showmodal: false
        })
        app.globalData.userInfo = res.userInfo
      }
    })
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      if (wx.getStorageSync('campusID')) {
          that.globalData.campus = wx.getStorageSync('campusID')
      } else {
          wx.setStorageSync('campus','广州校园圈')
      }
      if (wx.getStorageSync('openid')) {
        that.globalData.openid = wx.getStorageSync('openid')
        // that.checkVerify(wx.getStorageSync('openid'))
        that.checkMember(wx.getStorageSync('openid'))
        that.checkPhone(wx.getStorageSync('openid'))
        that.checkCampusRegion(wx.getStorageSync('openid'))
      } else {
        wx.login({
          success (res) {
            if (res.code) {
              //发起网络请求
              wx.request({
                url: api.Login,
                method:'GET',
                data: {
                  code: res.code,
                  appid:that.globalData.appid,
                },
                header: {
                  'content-type': 'application/json' // 默认值
                },
                success (res) {
                  console.log(res.data)
                  that.globalData.openid = res.data.result.openid
                  wx.setStorageSync('openid', res.data.result.openid)
                //   that.checkVerify(res.data.result.openid)
                  that.checkMember(res.data.result.openid)
                  that.checkPhone(res.data.result.openid)
                  that.checkCampusRegion(res.data.result.openid)
                }
              })
            } else {
              console.log('登录失败！' + res.errMsg)
            }

          }
        })
      }
      if ((wx.getStorageSync('avatar') == "" || wx.getStorageSync('userName') == "")){
        const timestamp = Math.floor(Date.now() / 1000).toString().slice(-4);
        const picked = pickRandomAvatar(this.globalData.avatarList, timestamp);
        var userName = picked.userName;
        var avatar   = picked.avatar;   
        wx.setStorageSync('avatar',avatar)
        wx.setStorageSync('userName',userName)
        wx.request({
            url: api.UdpateUserInfoXiaoyuan,
            method:'GET',
            data: {
                openid: that.globalData.openid,
                avatar:avatar,
                nickname:userName,
                campus: that.globalData.campus,
                region:that.globalData.region
            },
            header: {
                'content-type': 'application/json' // 默认值
            },
            success (res2) {
                console.log("res2:",res2)
            
            }
        })
      } else {
        wx.request({
            url: api.UdpateUserInfoXiaoyuan,
            method:'GET',
            data: {
                openid: that.globalData.openid,
                avatar:wx.getStorageSync('avatar'),
                nickname:wx.getStorageSync('userName'),
                campus: that.globalData.campus,
                region:that.globalData.region
            },
            header: {
                'content-type': 'application/json' // 默认值
            },
            success (res2) {
                console.log("res2:",res2)
            
            }
        })
      }
      
    //   if (wx.getStorageSync('campus')) {
    //     wx.switchTab({
    //         url: 'pages/index/index'
    //     })
    //   } else {
    //       wx.reLaunch({
    //           url: 'pages/selectCampus/selectCampus'
    //       })
    //   }
    }
  },

  checkMember(openid) {
    wx.request({
      url: api.GetMember,
      method:'GET',
      data: {
        openid:openid,
        // campus:this.globalData.campus
        campus:this.globalData.region
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
      //   console.log(res.data.memberList[0].au4)
          if (res.data.memberList.length > 0) {
              if (res.data.memberList[0].au4 > 0) {
                wx.setStorageSync('isdel', true)
              } else {
                wx.setStorageSync('isdel', false)
              }
          } else {
              wx.setStorageSync('isdel', false)
          }
      },
    })
  },

  checkVerify(openid) {
    wx.request({
      url: api.CheckVerifyUserQuanzi,
      method:'GET',
      data: {
        openid: openid
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        if (res.data.code == "200") {
          wx.setStorageSync('isVerified', 1)
        } else if (res.data.code == "0") {
          wx.setStorageSync('isVerified', 0)
        } else {
          wx.setStorageSync('isVerified', -1)
        }
      }
    })
  },

  checkPhone(openid) {
    var that = this
    wx.request({
      url: api.CheckUserPhoneXiaoyuan,
      method:'GET',
      data: {
        openid: openid
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        console.log(res)
        if(res.data.res != -1) {
            that.globalData.phone = true
        }
      }
    })
  },

  checkCampusRegion(openid) {
    var that = this
    wx.request({
      url: api.GetUserInfo,
      method:'GET',
      data: {
        openid: openid
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        console.log("userInfo",res)
        if(res.data.res == null || res.data.res.campus == "" || res.data.res.campus == null || res.data.res.campus == "0") {
            // console.log(111111111)
            wx.reLaunch({
              url: '/pages/selectCampus/selectCampus',
            })
        } else {
            // that.globalData.region = res.data.res.region
            that.globalData.campus = res.data.res.campus
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

  setNavBarInfo () {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync();
    // 胶囊按钮位置信息
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    this.globalData.topEdge = menuButtonInfo.top;
    this.globalData.bottomEdge = menuButtonInfo.bottom;
    this.globalData.leftEdge = menuButtonInfo.left;
    this.globalData.rightEdge = menuButtonInfo.right;
    this.globalData.navHeight = systemInfo.statusBarHeight;
    // 导航栏高度 = 状态栏到胶囊的间距（胶囊距上距离-状态栏高度） * 2 + 胶囊高度 + 状态栏高度
    this.globalData.navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;
    this.globalData.menuBotton = menuButtonInfo.top - systemInfo.statusBarHeight;
    this.globalData.menuRight = systemInfo.screenWidth - menuButtonInfo.right;
    this.globalData.menuHeight = menuButtonInfo.height;
    this.globalData.menuWidth = menuButtonInfo.right - menuButtonInfo.left;
  },

  globalData: {
    openid: '',
    locationInfo: null,
    navBarHeight: 0, // 导航栏高度
    menuBotton: 0, // 胶囊距底部间距（保持底部间距一致）
    menuRight: 0, // 胶囊距右方间距（方保持左、右间距一致）
    menuHeight: 0, // 胶囊高度（自定义内容可与胶囊高度保证一致）
    menuWidth: 0,
    topEdge:0,
    bottomEdge:0,
    leftEdge:0,
    rightEdge:0,
    campus:0,
    region:8,
    template_id:"kbSotmRk-iT3zXSuXikIQaF7JgPIg7-lL8n_CRZougo",
    appid:"wxca56e7a3e874233a",
    shouldShowGathering: false, // 标记是否要显示组局内容
    postTabType: null, // 标记发布页要显示的 Tab 类型：'circle' | 'errand' | 'gather'
    tags:[{"name":"全部","img":"../../images/all.png",isSel:1},
    {"name":"日常","img":"../../images/ershou.png",isSel:0},
    {"name":"吐槽","img":"../../images/talk.png",isSel:0},
    {"name":"用品","img":"../../images/rent.png",isSel:0},
    {"name":"经验","img":"../../images/job.png",isSel:0},
    {"name":"求助","img":"../../images/help.png",isSel:0},
    {"name":"寻宠","img":"../../images/help.png",isSel:0},
    ],
    avatarList: {
      img: [
        'http://yqtech.ltd/animal/1.png',
        'http://yqtech.ltd/animal/2.png',
        'http://yqtech.ltd/animal/3.png',
        'http://yqtech.ltd/animal/4.png',
        'http://yqtech.ltd/animal/5.png',
        'http://yqtech.ltd/animal/6.png',
        'http://yqtech.ltd/animal/7.png',
        'http://yqtech.ltd/animal/8.png',
        'http://yqtech.ltd/animal/9.png',
        'http://yqtech.ltd/animal/10.png',
        'http://yqtech.ltd/animal/11.png',
        'http://yqtech.ltd/animal/12.png',
        'http://yqtech.ltd/animal/13.png',
        'http://yqtech.ltd/animal/14.png',
        'http://yqtech.ltd/animal/15.png',
        'http://yqtech.ltd/animal/16.png',
        'http://yqtech.ltd/animal/17.png',
        'http://yqtech.ltd/animal/18.png',
        'http://yqtech.ltd/animal/19.png',
        'http://yqtech.ltd/animal/20.png',
        'http://yqtech.ltd/animal/21.png',
        'http://yqtech.ltd/zhuke_avatar/1.png',
        'http://yqtech.ltd/zhuke_avatar/2.png',
        'http://yqtech.ltd/zhuke_avatar/3.png',
        'http://yqtech.ltd/zhuke_avatar/4.png',
        'http://yqtech.ltd/zhuke_avatar/5.png',
        'http://yqtech.ltd/zhuke_avatar/6.png',
        'http://yqtech.ltd/zhuke_avatar/7.png',
        'http://yqtech.ltd/zhuke_avatar/8.png',
        'http://yqtech.ltd/zhuke_avatar/9.png',
        'http://yqtech.ltd/zhuke_avatar/10.png',
        'http://yqtech.ltd/zhuke_avatar/11.png',
        'http://yqtech.ltd/zhuke_avatar/12.png',
        'http://yqtech.ltd/zhuke_avatar/13.png',
        'http://yqtech.ltd/zhuke_avatar/14.png',
        'http://yqtech.ltd/zhuke_avatar/15.png',
        'http://yqtech.ltd/zhuke_avatar/1.png',
        'http://yqtech.ltd/zhuke_avatar/2.png',
        'http://yqtech.ltd/zhuke_avatar/3.png',
        'http://yqtech.ltd/zhuke_avatar/4.png',
        'http://yqtech.ltd/zhuke_avatar/5.png',
        'http://yqtech.ltd/zhuke_avatar/6.png',
        'http://yqtech.ltd/zhuke_avatar/7.png',
        'http://yqtech.ltd/zhuke_avatar/8.png',
        'http://yqtech.ltd/zhuke_avatar/9.png',
        'http://yqtech.ltd/zhuke_avatar/10.png',
        'http://yqtech.ltd/zhuke_avatar/11.png',
      ],
      name: [
        'Bee',
        'Butterfly',
        'Monkey',
        'Octopus',
        'Sheep',
        'Snail',
        'Boa',
        'Dragonfly',
        'Nustang',
        'Octopus',
        'Peacock',
        'Antelope',
        'Walrus',
        'Starfish',
        'Otter',
        'Alligator',
        'Squirrel',
        'Ostrich',
        'Albatross',
        'Alpaca',
        'Ladybird',
        'Penguin',
        'Koala',
        'Panda',
        'Hedgehog',
        'Raccoon',
        'Chipmunk',
        'Seal',
        'Dolphin',
        'BlueWhale',
        'Caterpillar',
        'Firefly',
        'Jellyfish',
        'Seahorse',
        'Falcon',
        'Hummingbird',
        'Corgi',
        'RedFox',
        'Lynx',
        'PolarBear',
        'Kingfisher',
        'Hamster',
        'MantaRay',
        'Meerkat',
        'Chameleon',
        '马里奥',
        '多啦A梦'
      ]},
      phone:false,
  }
})