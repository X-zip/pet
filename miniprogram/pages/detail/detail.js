// pages/detail/detail.js
const app = getApp()
var util = require('../../utils/util.js')
var check = require('../../utils/check.js')
const token = require('../../utils/qntoken.js')
const qiniuUploader = require("../../utils/qiniuUploader.js");
var api = require('../../config/api.js');
var CryptoJS = require('../../utils/aes.js')
import Toast from '@vant/weapp/toast/toast';
import Poster from "../../miniprogram_dist/poster/poster.js"
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
Page({

  /**
   * Page initial data
   */
  data: {
    reply: false,
    pk: '',
    task: [],
    img: [],
    contact: '',
    flag: '0',
    open: false,
    autoplay: true, //是否开启自动切换
    interval: 3000, //自动切换时间间隔
    duration: 500, //滑动动画时长
    list: [],
    comment: [],
    form_info: '',
    secondIndex:'',
    state: false,
    like: [],
    is_like: [],
    imgOriList: [],
    is_self: false,
    hasUserInfo: false,
    pid:0,
    noMore: false,
    showPostePic:false,
    animalList: {
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
      ],
      nickNameOld:'',
      avatarOld:'',
      colorArr: ['rgba(53, 208, 242, 0.85)','rgba(228, 169, 138, 0.9)','rgba(228, 113, 17, 0.85)','rgba(169, 36, 144, 0.85)'],
      length:0,
    },
    sub_menu: {
      descs: [
        '正序',
        '倒序',
        '最热'
      ],
    },
    currentSmallTab: 0,
    clickList:[],
    likeList:[],
    itemTitle:"···",
    showShare: false,
    options: [
      { name: '微信', icon: 'wechat', openType: 'share' },
      { name: '分享海报', icon: 'poster' },
      { name: '朋友圈', icon: 'wechat-moments' },
    ],
    userinfo: {},
    QRcode_img: '',
    posterConfig: {},
    savepic: '',
  },

  onShareAppMessage: function() {
    var that=this
		wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    return {
      title: that.data.task[0].title,
    }
  },
  
	//用户点击右上角分享朋友圈
	onShareTimeline: function () {
    var that = this
    console.log(that.data.img)
    if (that.data.img[0] != '') {
      return {
	      title: that.data.task[0].title,
	      imageUrl: that.data.img[0]
	    }
    } else {
      return {
	      title: that.data.task[0].title,
	      imageUrl: 'https://img.yqtech.ltd/macao/logo/anyway.jpg'
	    }
    }

	},

  reply(e) {
    console.log(e)
    this.setData({
      reply: true,
      cengzhu: e.currentTarget.dataset.id,
      replyName: e.currentTarget.dataset.user,
      pid:e.currentTarget.dataset.pid,
      second:e.currentTarget.dataset.second
    })
    console.log(this.data.second)
  },

  replyAll(e) {
    this.setData({
      reply: false,
    })
  },

  nologin() {
    wx.showToast({
      title: '未登陆！',
      icon: 'none',
      duration: 2000,
      mask: true,
    })
  },

  updatetime: function(e) {
    var that = this
    var pk = that.data.pk
    var time = util.formatTime(new Date())
    // const db = wx.cloud.database();
    wx.request({
      url: api.UpDateTask,
      method:'GET',
      data: {
        pk: pk,
        c_time:time
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        wx.showToast({
          title: '已置顶',
          mask: true,
        })
      },
    })
  },

  add_watch: function(e) {
    var that = this
    var pk = that.data.pk
    wx.request({
      url: api.IncWatch,
      method:'GET',
      data: {
        pk: pk,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
      },
    })
  },

  thumbsup: function(e) {
    var that = this
    var pk = that.data.pk 
    var openid = app.globalData.openid
    // const db = wx.cloud.database()
    // const _ = db.command
    console.log(that.data.state)
    if (that.data.state == false) {
      that.setData({
        ['state']: true
      })
      if (wx.getStorageSync('likeList').length>0) {
        var likeList = wx.getStorageSync('likeList')
        likeList.push(parseInt(pk,10))
        wx.setStorageSync('likeList', likeList)
        that.setData({
          likeList:likeList
        })
      } else {
        var likeList = []
        likeList.push(parseInt(pk,10))
        wx.setStorageSync('likeList', likeList)
        that.setData({
          likeList:likeList
        })
      }
      wx.request({
        url: api.AddLike,
        method:'GET',
        data: {
          pk: that.data.pk,
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
        ['state']: false
      })
      if (wx.getStorageSync('likeList').length>0) {
        var likeList = wx.getStorageSync('likeList')
        for (var i=0,len=likeList.length; i<len; i++) {
          if (likeList[i] == parseInt(pk,10)) {
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

  getPhoneNumber (e) {
    var that = this
    wx.request({
      url: api.GetPhoneXiaoyuan,
      method: "GET",
      header: {
        'content-type': 'application/json', // 默认值
      },
      data: {
        openid:app.globalData.openid,
        region:app.globalData.region,
        campus:app.globalData.campus,
        code: e.detail.code,
      },
      success: (res) => {
        console.log(res)
        if (res.data.result == -1) {
          wx.showToast({
            title: '请重试',
            icon:"none"
          })
        } else { 
          console.log(res.data.res)
          that.setData({
            phone:true
          })
          app.globalData.phone = true
        }     
      }
    });
  },

  submitForm(e) {
    var that = this;
    var pages = getCurrentPages();
    var userName = wx.getStorageSync('userName');
    var avatar = wx.getStorageSync('avatar');
    if(!userName || !avatar) {
        that.setData({
          checkedTreehole:true
        })
    }
    if (that.data.checkedTreehole) {
        const timestamp = Math.floor(Date.now() / 1000).toString().slice(-4);
        const picked = pickRandomAvatar(app.globalData.avatarList, timestamp);
        userName = picked.userName;
        avatar   = picked.avatar;
    }
    var form = e.detail.value;
    var that = this;
    var pk = that.data.pk
    console.log(e)
    if (pages.length > 1) {
      var page = pages[1].route + '?id=' + pk
    } else {
      var page = pages[0].route + '?id=' + pk
    }
    let tmplIds=[];
    tmplIds[0] = app.globalData.template_id
    wx.requestSubscribeMessage({
      tmplIds: tmplIds,
      success(res) {
        if (wx.getStorageSync('subNum')) {
          var num = Number(wx.getStorageSync('subNum'))
          num += 1
          wx.setStorageSync('subNum', num)
        } else {
          wx.setStorageSync('subNum', 1)
        }
      }
    })
    wx.showLoading({
      title: '发送中',
    })
    if (that.data.reply) {
      var applyTo = that.data.cengzhu
      var level = 2
    //   let comment = "回复"+ that.data.replyName + ":" + that.data.comment
    } else {
      var applyTo = that.data.task[0].openid
      var level = 1
    }
    console.log("level:"+level)
    let comment = that.data.comment
    // var openid = app.globalData.openid
    var c_time = util.formatTime(new Date())
    that.setData({
      ['comment.c_time']: c_time,
      ['comment.like_num']: 0,
      ['comment.pk']: that.data.pk,
      ['comment.avatar']: avatar,
      ['comment.userName']: userName,
      ['comment.comment']: form.comment,
      ['comment.level']: "2",
      ['comment.pid']: that.data.pid,
    })
    if (form.comment == "") {
    //if (1) {
      wx.showToast({
        title: '回复不能为空！',
        icon: 'none',
      })
      return;
    }  else if (!app.globalData.phone) {
        Toast.fail('手机号认证后才能发布！');
        wx.hideLoading()
    } else {
      // const db = wx.cloud.database()
      let checkResult = check.checkString(that.data.comment.comment,app.globalData.openid).then(function(result) {   
      // let result = check.checkString(that.data.comment.comment,app.globalData.openid)
      console.log("result: ",result)
      console.log(that.data.comment.pk,app.globalData.openid,applyTo,level,that.data.pid)
      if (result) {
            var key = '1234512345123456';
            var iv = '1234512345123456';
            key = CryptoJS.enc.Utf8.parse(key);
            iv = CryptoJS.enc.Utf8.parse(iv);
            var content = that.data.comment.comment
            if (that.data.reply) {
                content = "回复"+ that.data.replyName + ":" + that.data.comment.comment
            }
            var title = content
            var param = '{"content":"'+content+'","title":"'+title+'","verify":"zzyq",'+'"c_time":"'+ new Date() +'"}'
            var encrypted = CryptoJS.AES.encrypt(param, key, {
                iv: iv,
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            });
            encrypted = encrypted.ciphertext.toString().toUpperCase();
          console.log("that.data.reply:",that.data.reply)
          var comment_text = that.data.comment.comment
          if (that.data.reply) {
             comment_text = "回复"+ that.data.replyName + ":" + that.data.comment.comment
          }
          console.log("comment_text:",comment_text)
          wx.request({
            url: api.Addcomment,
            method:'GET',
            data: {
              c_time: c_time,
              openid:app.globalData.openid,
              pk: that.data.comment.pk,
              comment: comment_text,
              userName: userName,
              avatar: avatar,
              applyTo: applyTo,
              img:that.data.imgOriList,
              level:level,
              pid:that.data.pid,
              encrypted:encrypted
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
              if(res.data.code==200) {
                wx.showToast({
                  title: '您已被禁言！',
                  icon: 'none',
                  duration: 1500
                })
              } else if(res.data.code==1){
                wx.showToast({
                  title: '您已被禁言1天！',
                  icon: 'none',
                  duration: 1500
                })
              } else if(res.data.code==3){
                wx.showToast({
                  title: '您已被禁言3天！',
                  icon: 'none',
                  duration: 1500
                })
              } else if(res.data.code==7){
                wx.showToast({
                  title: '您已被禁言7天！',
                  icon: 'none',
                  duration: 1500
                  })
              } else {
                if (level == 2) {
                  console.log("new comment:",that.data.comment)
                  var list = that.data.list
                  var new_comment = that.data.comment
                  for (var i=0;i<list.length;i++){
                    if (list[i].id == that.data.pid) {
                      list[i].commentList.push(new_comment) 
                    }
                  } 
                  console.log("list:",that.data.list)
                  that.setData({
                    list: list
                  })
                }
                var title = that.data.task[0].title
                comment = that.data.comment.comment
                if (title.length>15) {
                  title = title.substr(0,15)+'...'
                }
                if (that.data.comment.comment.length>15) {
                  comment = comment.substr(0,15)+'...'
                }
                wx.request({
                  url: api.SendComment,
                  method:'GET',
                  data:{
                    openid: applyTo,
                    page: page,
                    title: title,
                    comment: comment,
                    time: c_time,
                    campus:app.globalData.region,
                    template_id:app.globalData.template_id,
                    appid:app.globalData.appid,
                  },
                  header: {
                    'content-type': 'application/json' // 默认值
                  },
                  success: function(res) {
                    console.log(res)
                    var num = Number(wx.getStorageSync('subNum'))
                    num -= 1
                    if (num <= 0) {
                      wx.setStorageSync('subNum', 0)
                    } else {
                      wx.setStorageSync('subNum', num)
                    }
                  }
                })
                that.setData({
                  form_info: '',
                  reply: false,
                })
                wx.hideLoading()
                wx.showToast({
                  title: '发送成功',
                  icon: 'none',
                })
                that.onShow()
              }          
            },
          })
        
        
      } else {
        wx.hideLoading()
        wx.showToast({
          title: '有违规内容！',
          icon: 'none',
          duration: 1500
        })
      }
      })
    }
  },

  /**
   * Lifecycle function--Called when page load
   */
  get_info: function() {
    var that = this;
    wx.setClipboardData({
      data: that.data.task[0].wechat,
      success: function(res) {
        // self.setData({copyTip:true}),
        wx.showModal({
          title: '提示',
          content: '对方联系方式已复制到粘贴板，请尽快与对方联系！',
          success: function(res) {
            if (res.confirm) {
            } else if (res.cancel) {
            }
          }
        })
      }
    }) 
  },

  return_index: function() {
    wx.switchTab({
      url: '../index/index',
    })
  },

  toSuggestion: function() {
    if (this.data.hasUserInfo) {
      wx.navigateTo({
        url: '../uitem/suggestion/suggestion?id=' + this.data.pk,
      })
    } else {
      wx.showToast({
        title: '请先登录！',
        icon: 'none',
        duration: 2000,
        mask: true,
      })
    }

  },

  toTreeHole: function() {
    wx.switchTab({
      url: '../treehole/treehole',
    })
  },

  onLoad: function(query) {
    var that = this
    console.log(that.data.imgOriList.length)
    if(query.scene) {
      var pk = decodeURIComponent(query.scene).replace('id=','')
    } else {
      var pk = query.id
    }
    var openid = app.globalData.openid
    that.checkPhone(openid)
    that.setData({
      current_openid:openid,
    })
    if (wx.getStorageSync('nickName')) {
      var nickNameInfo = wx.getStorageSync('nickName')
      this.setData({
        nickNameOld:nickNameInfo
      })
    }
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    })
    that.setData({
      pk: pk
    })
    // that.add_watch()
    if (wx.getStorageSync('avatarUrl') && wx.getStorageSync('userName')) {
        this.setData({
          hasUserInfo: true
        })
      }
    that.setData({
        isdel: wx.getStorageSync('isdel')
    })
    var clickList = wx.getStorageSync('clickList')
    var likeList = wx.getStorageSync('likeList')
    that.setData({
      clickList:clickList,
      likeList:likeList
    })
    // var kuaishou = wx.getStorageSync('kuaishoutime')
    // var now = Date.parse(new Date());
    // if (kuaishou == "" || (now - kuaishou)/1000 > 60*60*6) {
    //     wx.request({
    //         url: 'https://kl014.hwm01.cn/?k=5ao81bjiob4t2',
    //         method:'GET',
    //         data: {
    //         },
    //         header: {
    //             'content-type': 'application/json' // 默认值
    //         },
    //         success (res) {
    //             console.log(res.data.text)
    //             wx.setStorageSync('kuaishoutime', Date.parse(new Date()))
    //             wx.setClipboardData({
    //                 data: res.data.text,
    //                 success: function(res) {
    //                     wx.hideToast()
    //                     wx.showLoading({
    //                         title: '加载中',
    //                         mask: true,
    //                     })
    //                     wx.hideLoading()
    //                     console.log(res)
    //                 }
    //             })    
    //         }
    //     })
    // }
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
            app.globalData.phone = true
            that.setData({
                phone:true
            })
        } else {
            app.globalData.phone = false
            that.setData({
                phone:false
            })
        }
      }
    })
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
    wx.showLoading({
        title: '加载中',
    })
    var that = this
    var openid = app.globalData.openid
    var pk = that.data.pk
    that.setData({
        phone:app.globalData.phone
    })
    wx.request({
      url: api.GettaskbyId,
      method:'GET',
      data: {
        pk: pk,
        region:app.globalData.region,
        campus:app.globalData.campus,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {  
        console.log(res)
         if (res.data.taskList.length > 0){
          if (openid == res.data.taskList[0].openid) {
            that.setData({
              is_self: true
            })
          }
          if (res.data.taskList[0].is_complaint == 1){
            // wx.showModal({
            //   title: '提示',
            //   content: '可能涉及敏感内容，正在人工审核中',
            //   showCancel:false,
            //   success (res) {
            //     if (res.confirm) {
            //       wx.navigateBack({
            //         delta: 1,
            //       })
            //     }
            //   }
            // })
          }
          that.setData({
            img: res.data.taskList[0].img.split(','),
            task:res.data.taskList,
            flag: '1'
          })
          wx.hideLoading()
        }  else {
          wx.hideLoading()
          wx.showModal({
            title: '提示',
            content: '该内容已被发布者删除,请返回首页查看其他内容',
            showCancel:false,
            success (res) {
              if (res.confirm) {
              wx.switchTab({
                url: '../index/index',
              })
              }
              }
          })
        }       
      }
    })
    var e = that.data.currentSmallTab
    that.getComment(e)
    if(wx.getStorageSync('likeList')) {
      var likeList = wx.getStorageSync('likeList')
      if (likeList.indexOf(parseInt(pk,10),0)!=-1){
        that.setData({
          state:true
        })
      }
    } else {
      that.setData({
        state:false
      })
    }
  },

  imgYu: function(e) {
    var that = this
    console.log(e)
    //图片预览
    wx.previewImage({
      current: e.currentTarget.dataset.src,
      urls: that.data.img,
    })
  },

  commentYu: function(e) {
    var that = this
    console.log(e)
    //图片预览
    var urlList = []
    urlList.push(e.currentTarget.dataset.src)
    wx.previewImage({
      current: e.currentTarget.dataset.src,
      urls: urlList,
    })
  },

  
  delete_detail(e) {
    console.log(e)
    wx.showModal({
      title: '提示',
      content: '确定要删除吗？',
      success: function(sm) {
        if (sm.confirm) {
          // 用户点击了确定 可以调用删除方法了  
          var pk = e.target.dataset.id
          var key = '1234512345123456';
          var iv = '1234512345123456';
          key = CryptoJS.enc.Utf8.parse(key);
          iv = CryptoJS.enc.Utf8.parse(iv);
          var param = '{"id":"'+pk+'"}'
          var encrypted = CryptoJS.AES.encrypt(param, key, {
            iv: iv,
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
          });
          encrypted = encrypted.ciphertext.toString().toUpperCase();  
          wx.request({
            url: api.DeleteTask,
            method:'GET',
            data: {
              pk:encrypted
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
              // wx.switchTab({
              //   url: '../index/index',
              // })
              wx.navigateBack({
                delta: 0,
              })
            },
          })
        } else if (sm.cancel) {
    
        }
      }
    })
  },

  delete_comment(e) {
    var that = this
    wx.showModal({
      title: '提示',
      content: '确定要删除吗？',
      success: function (sm) {
        if (sm.confirm) {
          // 用户点击了确定 可以调用删除方法了  
          console.log(e.target.dataset.id)
          var pk = e.target.dataset.id
          // const db = wx.cloud.database()
          wx.request({
            url: api.DeleteComment,
            method:'GET',
            data: {
              pk:parseInt(pk)
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

  getSecondComment:function(id){
    var that = this
    console.log("secondIndex"+that.data.second)
    wx.request({
      url: api.GetSecondLevel,
      method:'GET',
      data: {
        id: id,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        console.log(res)
        var data = 'list[' + that.data.second + '].commentList';
        that.setData({
          [data]: res.data.commentSecondList
        })
        that.setData({
          secondIndex:''
        })
        console.log(that.data.list)
      },
    })
  },

  getComment:function(e) {
    var that = this
    var pk = that.data.pk    
    var old_data = that.data.list;
    var length = old_data.length
    console.log(e,length)
    wx.request({
      url: api.GetCommentByType,
      method:'GET',
      data: {
        length:length,
        pk: pk,
        type:e,
        region:app.globalData.region,
        campus:app.globalData.campus,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        console.log(res.data.commentList)
        var list = res.data.commentList
        for (var i=0;i<list.length;i++){
          if (list[i].commentList.length > 1) {
            list[i].fold = 1
            list[i].secondLength = list[i].commentList.length - 1 
          }
          // if () {

          // }
        } 
        that.setData({
          list: old_data.concat(list)
        })
        console.log(that.data.list)
        if (res.data.commentList.length == 0) {
          that.setData({
            noMore: true
          })
        }
      },
    })
  },

  onPageScroll: function (e) {//监听页面滚动
    if (this.data.task_id!= null) {
      var id = '#item-' + this.data.task_id+this.data.currentSmallTab
      this.selectComponent(id).toggle(false);
    }
    
  },

  setTaskId(e) {
    console.log(e)
    var task_id = e.currentTarget.dataset.id
    this.setData({
      task_id:task_id
    })
    console.log("task_id",this.data.task_id)
  },

  unfold(event) {
    console.log(event.currentTarget.dataset.id)
    var id = event.currentTarget.dataset.id
    var that = this
    var list = that.data.list
    for (var i=0;i<list.length;i++){
      if (list[i].id == id) {
        list[i].fold = 0
      }
    } 
    console.log(list)
    that.setData({
      list:list
    })
  },

  takePhoto: function() {
    var that = this;
    //拍照、从相册选择上传
    wx.chooseMedia({
      count: 1, //这个是上传的最大数量，默认为9
      mediaType: ['image'],
      sourceType: ['album', 'camera'], //这个是图片来源，相册或者相机
      success: function(res) {
        that.setData({
          imgOriList:[]
        })
        console.log(res)
        var tempFilePaths = res.tempFiles //这个是选择后返回的图片列表
        that.getCanvasImg(0, 0, tempFilePaths) //进行压缩
      }
    });
  },

  getCanvasImg: function (index, failNum, tempFilePaths) {
    wx.showLoading({
      title: '上传中...',
      mask: true
    });
    var that = this;
    if (index < tempFilePaths.length) {
      wx.getImageInfo({
        src: tempFilePaths[index].tempFilePath,
        success(respone) {
          var canvasWidth = respone.width;
          var canvasHeight = respone.height;
          // 压缩比例
          // 最大尺寸限制
          var maxWidth = 1000;
          var maxHeight = 1000;
          // 目标尺寸
          var targetWidth = canvasWidth;
          var targetHeight = canvasHeight;
          // 等比例压缩，如果宽度大于高度，则宽度优先，否则高度优先
          if (canvasWidth > maxWidth || canvasHeight > maxHeight) {
            if (canvasWidth / canvasHeight > 1) {
              // 宽图片
              targetWidth = maxWidth;
              targetHeight = Math.round(maxWidth * (canvasHeight / canvasWidth));
            } else {
              // 高图片
              targetHeight = maxHeight;
              targetWidth = Math.round(maxHeight * (canvasWidth / canvasHeight));
            }
          }
          // 更新 canvas 大小
          that.setData({
            canvasWidth: targetWidth,
            canvasHeight: targetHeight
          });
          // 使用新的 Canvas 2D 接口
          wx.createSelectorQuery()
            .select('#attendCanvasId')
            .fields({ node: true, size: true })
            .exec((res) => {
              const canvas = res[0].node;
              const ctx = canvas.getContext('2d');
              // 设置画布大小
              canvas.width = targetWidth;
              canvas.height = targetHeight;
              // 创建图片对象
              const img = canvas.createImage();
              img.src = tempFilePaths[index].tempFilePath;
              img.onload = () => {
                ctx.clearRect(0, 0, targetWidth, targetHeight);
                ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                // 导出图片
                wx.canvasToTempFilePath({
                  canvas: canvas,
                  destWidth: targetWidth,
                  destHeight: targetHeight,
                  fileType: 'jpg',
                  success: function (resP) {
                    wx.compressImage({
                      src: resP.tempFilePath, // 图片路径
                      quality: 95, // 压缩质量
                      success(ressss) {
                        wx.uploadFile({
                          filePath: ressss.tempFilePath,
                          name: 'file',
                          url: api.ImgCheck,
                          header: {
                            'content-type': 'multipart/form-data'
                          },
                          success: function (checkres) {
                            if (JSON.parse(checkres.data).errmsg == "ok") {
                              that.uploadCanvasImg(ressss.tempFilePath, ressss.tempFilePath);
                            } else {
                              wx.hideLoading();
                              wx.showToast({
                                title: '图片违规！',
                                icon: 'error'
                              });
                            }
                          },
                          fail: function (checke) {
                            wx.hideLoading();
                            wx.showToast({
                              title: '图片违规！',
                              icon: 'error'
                            });
                          }
                        });
                      }
                    });
                  },
                  fail: function (e) {
                    failNum += 1; // 失败数量，可以用来提示用户
                    that.getCanvasImg(index, failNum, tempFilePaths);
                  }
                });
              };
              img.onerror = (err) => {
                console.error(err);
              };
            });
        }
      });
    } else {
      wx.hideLoading();
    }
  },

  uploadCanvasImg: function(oriImg) {
    wx.showLoading({
      title: '正在上传图片...',
      mask: true
    })
    this.gettoken()
    this.uploadOri(oriImg)
  },

  gettoken() {
    var tokendata = []
    tokendata.ak = 'wnkRCtmFWg7DZhCLjT72UOAT9WCdaI-TkPi8ncHr'
    tokendata.sk = '_8ZESS4_ZA0fqCMekohRgyVbWT01C7qi12Xj2OM7'
    tokendata.bkt = 'gzj'
    tokendata.cdn = ''
    this.data.tokendata = tokendata
    var uptoken = token.token(tokendata)
    this.setData({
      uptoken: uptoken
    })
    //console.log('uptoken', uptoken, this.data.tokendata)
  },

  uploadOri(e) {
    wx.showLoading({
      title: '正在上传图片...',
      mask: true
    })
    var that = this
    qiniuUploader.upload(
      e, //上传的图片
      (res) => { //回调 success
        console.log(res)
        let url = 'http://' + res.imageURL;      
        console.log("imageOri:", url);
        let imgOriList = that.data.imgOriList;
        console.log(imgOriList)
        imgOriList.push(url)
        that.setData({
          imgOriList: imgOriList,
        })
        wx.hideLoading()
      },
      (error) => { //回调 fail
        console.log('error: ' + error);
      }, {
        // 参数设置  地区代码 token domain 和直传的链接 注意七牛四个不同地域的链接不一样，我使用的是华南地区
        region: 'SCN',
        // ECN, SCN, NCN, NA, ASG，分别对应七牛的：华东，华南，华北，北美，新加坡 5 个区域
        uptoken: that.data.uptoken, //上传凭证自己生成
        uploadURL: 'https://upload-z2.qiniup.com', //下面选你的区z2是华南的
        domain: 'yqtech.ltd', //cdn域名建议直接写出来不然容易出异步问题如domain:‘你的cdn’
      },
      (progress) => {

      },
    )
  },

  bottomNavChange: function(e) {
    var _this = this,nextActiveIndex = e.currentTarget.dataset.current,
      currentIndex = _this.data.currentSmallTab;
    if (currentIndex != nextActiveIndex) {
      _this.setData({
        currentSmallTab: nextActiveIndex,
        prevSmallIndex: currentIndex
      });
      _this.setData({
        list:[],
      });
      _this.getComment(_this.data.currentSmallTab)
    }
  },

  onChange(event) {
    console.log(event)
    if (event.detail.name == 2) {
      this.setData({
        currentSmallTab:2,
        list:[],
      })
    } else if (event.detail.name == 1) {
      this.setData({
        currentSmallTab:1,
        list:[],
      })
    } else {
      this.setData({
        currentSmallTab:0,
        list:[],
      })
    }
    this.getComment(this.data.currentSmallTab)
  },

  clickComment:function(e){
    var that =this
    if (wx.getStorageSync('clickList').length>0) {
      var clickList = wx.getStorageSync('clickList')
      clickList.push(e.currentTarget.dataset.id)
      wx.setStorageSync('clickList', clickList)
      that.setData({
        clickList:clickList
      })
    } else {
      var clickList = []
      clickList.push(e.currentTarget.dataset.id)
      wx.setStorageSync('clickList', clickList)
      that.setData({
        clickList:clickList
      })
    }
    var list = that.data.list
    for (var i in list) {
      if (list[i].id == e.currentTarget.dataset.id) {
        list[i].like_num ++
      } else {
        for (var j in list[i].commentList) {
          if (list[i].commentList[j].id == e.currentTarget.dataset.id){
            list[i].commentList[j].like_num ++
          }
        }
      }
    }
    console.log(list)
    that.setData({
      list:list
    })
    wx.request({
      url: api.IncCommentLike,
      method:'GET',
      data: {
        pk: e.currentTarget.dataset.id,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        
      },
    })
  },

  unClickComment:function(e){
    var that =this
    if (wx.getStorageSync('clickList').length>0) {
      var clickList = wx.getStorageSync('clickList')
      for (var i=0,len=clickList.length; i<len; i++) {
        if (clickList[i] == e.currentTarget.dataset.id) {
          clickList.splice(i,1)
        }
      }
      wx.setStorageSync('clickList', clickList)
      console.log(wx.getStorageSync('clickList'))
      that.setData({
        clickList:clickList
      })
    }
    var list = that.data.list
    for (var i in list) {
      if (list[i].id == e.currentTarget.dataset.id) {
        list[i].like_num --
      } else {
        for (var j in list[i].commentList) {
          if (list[i].commentList[j].id == e.currentTarget.dataset.id){
            list[i].commentList[j].like_num --
          }
        }
      }
    }
    console.log(list)
    that.setData({
      list:list
    })
    wx.request({
      url: api.DecCommentLike,
      method:'GET',
      data: {
        pk: e.currentTarget.dataset.id,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        
      },
    })
  },

  /**
   * Lifecycle function--Called when page hide
   */
  onHide: function() {

  },

  /**
   * Lifecycle function--Called when page unload
   */
  onUnload: function() {

  },

  /**
   * Page event handler function--Called when user drop down
   */
  onPullDownRefresh: function() {

  },

  /**
   * Called when page reach bottom
   */
  onReachBottom: function() {
    var that = this
    var e = that.data.currentSmallTab
    that.getComment(e)
    if (that.data.noMore) {
      wx.showToast({
        title: '没有更多内容',
        icon: 'none'
      })
    }
  },

  clickComment:function(e){
    var that =this
    if (wx.getStorageSync('clickList').length>0) {
      var clickList = wx.getStorageSync('clickList')
      clickList.push(e.currentTarget.dataset.id)
      wx.setStorageSync('clickList', clickList)
      that.setData({
        clickList:clickList
      })
    } else {
      var clickList = []
      clickList.push(e.currentTarget.dataset.id)
      wx.setStorageSync('clickList', clickList)
      that.setData({
        clickList:clickList
      })
    }
    var list = that.data.list
    for (var i in list) {
      if (list[i].id == e.currentTarget.dataset.id) {
        list[i].like_num ++
      } else {
        for (var j in list[i].commentList) {
          if (list[i].commentList[j].id == e.currentTarget.dataset.id){
            list[i].commentList[j].like_num ++
          }
        }
      }
    }
    console.log(list)
    that.setData({
      list:list
    })
    wx.request({
      url: api.IncCommentLike,
      method:'GET',
      data: {
        pk: e.currentTarget.dataset.id,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        
      },
    })
  },

  unClickComment:function(e){
    var that =this
    if (wx.getStorageSync('clickList').length>0) {
      var clickList = wx.getStorageSync('clickList')
      for (var i=0,len=clickList.length; i<len; i++) {
        if (clickList[i] == e.currentTarget.dataset.id) {
          clickList.splice(i,1)
        }
      }
      wx.setStorageSync('clickList', clickList)
      console.log(wx.getStorageSync('clickList'))
      that.setData({
        clickList:clickList
      })
    }
    var list = that.data.list
    for (var i in list) {
      if (list[i].id == e.currentTarget.dataset.id) {
        list[i].like_num --
      } else {
        for (var j in list[i].commentList) {
          if (list[i].commentList[j].id == e.currentTarget.dataset.id){
            list[i].commentList[j].like_num --
          }
        }
      }
    }
    console.log(list)
    that.setData({
      list:list
    })
    wx.request({
      url: api.DecCommentLike,
      method:'GET',
      data: {
        pk: e.currentTarget.dataset.id,
      },
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        
      },
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

  toSuggestion: function() {
    console.log("1")
    wx.navigateTo({
      url: '../uitem/suggestion/suggestion',
    })
  },

  onChangeComment(event) {
    // event.detail 为当前输入的值
    console.log(event.detail);
  },

  onChangeTreehole({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.setData({ checkedTreehole: detail });
  },

  onClickShare(event) {
    this.setData({ showShare: true });
  },

  onCloseShare() {
    this.setData({ showShare: false });
  },

  onSelectShare(event) {
    // Toast(event.detail.name);
    if (event.detail.name == "分享海报") {
        // this.drawPoster()
        var content = this.data.task[0].content.substring(0, 50)+"...";
        wx.request({
            url: api.GenerateSelectedXiaoyuan,
            method:'GET',
            data: {
              region: "9",
              taskid:this.data.task[0].id
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
              console.log(res.data.res)
              wx.navigateTo({
                url: './poster/poster?content=' + content +"&&url="+res.data.res,
              })
            },
        })
        
    } else if (event.detail.name == "朋友圈") {
        Toast("请点击右上角胶囊按钮，分享到朋友圈！");
        this.onCloseShare();
    }
  },

  async drawPoster() {
    const _this = this
    const qrcodeRes = {
      scene: "poster",
      page: 'pages/index/index',
      is_hyaline: true,
      autoColor: true,
      expireHours: 1
    }
    wx.request({
        url: api.GenerateSelectedXiaoyuan,
        method:'GET',
        data: {
          region: "4",
          taskid:_this.data.task[0].id
        },
        header: {
          'content-type': 'application/json' // 默认值
        },
        success (res) {
          console.log(res.data.res)
          _this.drawSharePicDone(res.data.res)
        },
      })
    // 
  },
  // 绘制参数
  drawSharePicDone(url) {
    var that = this
    var campus = wx.getStorageSync('campus')
    var message = that.data.task[0].content.substring(0, 20)+"...";
    this.setData({
      posterConfig: {
        width: 420,
        height: 170,
        backgroundColor: '#fff',
        debug: false,
        blocks: [
          {
            x: 10,
            y: 10,
            width: 400,
            height: 150,
            borderWidth: 1,
            borderColor: '#c2c2c2',
            borderRadius: 10,
          },
        ],
        texts: [
          {
            x: 150,
            y: 40, //上边距
            width: 120,
            lineNum: 1,
            text: campus,
            // textAlign: 'center',
            fontSize: 22,
            color: 'black',
          },
          {
            x: 150,
            y: 80, //上边距
            width: 230,
            lineNum: 4,
            text: message,
            // textAlign: 'center',
            fontSize: 16,
            color: '#000',
          },
        ],
        images: [
            {
                width: 100,
                height: 100,
                x: 20,
                y: 40,
                borderRadius: 100,
                url: url,
                zIndex: 999999999,
            },
        ],
      }
    }, () => {
      Poster.create();
    });
  },
  // 绘制成功
  onPosterSuccess(e) {
    console.log('success:', e)
    // this.gettoken()
    // this.uploadOri(e.detail)
    wx.previewImage({
      urls: [e.detail],
    })
    this.setData({
      posterImg: e.detail, // 当前页面图片路径
      showposterImg: true
    })
  },
  // 绘制失败
  onPosterFail(e) {
    console.error('fail:', e)
  },
  // 保存图片
  savePosterPic(){
    const _this = this
    // 调用小程序保存图片api
    wx.saveImageToPhotosAlbum({
      filePath: "https://ftp.bmp.ovh/imgs/2020/09/d2dab2061d80ae3f.jpg",
      success: (res) => {
        wx.showModal({
          content: '已保存到手机相册',
          showCancel: false,
          confirmText: '知道了',
          confirmColor: '#333'
        })
      },
      fail: (res) => {
        wx.showToast({
          title: "保存失败",
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  addBlackList(e) {
    console.log(e)
    wx.showModal({
      title: '提示',
      content: '确定要拉黑吗？',
      success: function(sm) {
        if (sm.confirm) {
          // 用户点击了确定 可以调用删除方法了  
          var openid = e.target.dataset.openid
          wx.request({
            url: api.AddBlacklistXiaoyuan,
            method:'GET',
            data: {
                openid:openid,
                campus:app.globalData.region,
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
                wx.showToast({
                    title: '成功加入黑名单！',
                    icon: 'none',
                })
            },
          })
        } else if (sm.cancel) {
    
        }
      }
    })
  },

  addTop(e) {
    var that = this
    console.log(e)
    wx.showModal({
      title: '提示',
      content: '确定要置顶吗？',
      success: function(sm) {
        if (sm.confirm) {
          // 用户点击了确定 可以调用删除方法了  
          var openid = e.target.dataset.openid
          wx.request({
            url: api.TopTaskXiaoyuan,
            method:'GET',
            data: {
                taskid:that.data.task[0].id,
                region:app.globalData.region,
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
                wx.showToast({
                    title: '成功置顶！',
                    icon: 'none',
                })
            },
          })
        } else if (sm.cancel) {
    
        }
      }
    })
  },

  cancelTop(e) {
    var that = this
    console.log(e)
    wx.showModal({
      title: '提示',
      content: '确定要取消置顶吗？',
      success: function(sm) {
        if (sm.confirm) {
          // 用户点击了确定 可以调用删除方法了  
          var openid = e.target.dataset.openid
          wx.request({
            url: api.DownTaskXiaoyuan,
            method:'GET',
            data: {
                taskid:that.data.task[0].id,
                region:app.globalData.region,
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
                wx.showToast({
                    title: '成功取消置顶！',
                    icon: 'none',
                })
            },
          })
        } else if (sm.cancel) {
    
        }
      }
    })
  },

  /**
   * Called when user click on the top right corner to share
   */
})