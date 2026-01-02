// pages/chat/chat.js
const App = getApp();
const app = getApp();
const util = require('../../utils/util');
var api = require('../../config/api.js');
var check = require('../../utils/check.js')
let socketOpen = false;
import Dialog from '@vant/weapp/dialog/dialog';
import Toast from '@vant/weapp/toast/toast';

Page({

  /**
   * 页面的初始数据
   */
  data: {
    triggered: false,
    typeToCode:{
      'text':0,
      'image':1,
      'video':2
    },
    pageName:'',//页面名称
    popupFlag:true,
    sendId:0,//当前用户,此处定死实际场景中改为自己业务ID
    sendOpenId:'',//当前用户OPENID
    lineHeight: 24,//表情的大小
    receiveId:'',//接受人
    roomId:'',//房间ID 防止串线
    list:[],//消息列表
    focus: false,//光标选中
    cursor: 0,//光标位置
    comment:'',//文本内容
    resource:'',//资源内容 图片或视频
    functionShow: false,//扩展区
    toLast:'toLast',// 滚动到底部
    emojiShow: false, //表情区是否显示
    paddingBottom:80, //消息内容区距底部的距离
    keyboardHeight:0,//输入框距下边框距离
    emojiSource: 'http://www.wmbyte.com/img/chat_message_minip/emoji-sprite.png',//表情图片
    windowHeight:0,//聊天内容区的高度
    sendAvatar:'https://lyhl.oss-cn-shanghai.aliyuncs.com/20210530/cbe1b8d05cd74745b058dfcb5961e71d.jpg',//当前用户头像
    receiveAvatar:'',//聊天对象头像
    limit:1,//重连次数
    imgList:[],//聊天记录中的图片数组
    pageNo:1, //聊天记录页码
    pageSize:10,
    isDisConnection:false,//是否是手动断开锻炼
    isGroupChat:false
  },
  /**
   * 生命周期函数--监听页面加载
   *
   */

  onLoad: function (options) {
    //当前用户OPENID
    console.log(options)
    let openId = App.globalData.openid;
    console.log("屏幕高度："+wx.getSystemInfoSync().windowHeight);
    console.log("头高度："+App.globalData.navHeight);
    const receiveOpenId = options.openid1;
    var status = options.status
    if (status == 5) {
        this.setData({
            isGroupChat:true
        })
    }
    var f_avatar = options.f_avatar
    console.log(status)
    this.setData({
        sendOpenId:openId,
        sendAvatar:wx.getStorageSync("avatar"),
        receiveOpenId:options.openid1,
        status:status,
        receiveAvatar:f_avatar
    })
    this.getUsersChatDetail(openId,receiveOpenId)
    this.getScollBottom();
    this.updateLastReadTime(receiveOpenId);
  },

  updateLastReadTime(receiveOpenId) {

    wx.request({
        url: api.UpdateLastReadTime,
        data: {
          openid:app.globalData.openid,
          targetOpenid:receiveOpenId,
          region:app.globalData.region,
          campus:app.globalData.campus
        },
        header: {
          'content-type': 'json' // 默认值
        },
        success: function(res) {
          console.log(res.data);
        }
    })
  },

  // 链接websocket
  linkSocket() {
    let that = this
    var roomID = ""
    var receiveOpenId = that.data.receiveOpenId
    var sendOpenId= that.data.sendOpenId
    var isGroupChat = that.data.isGroupChat
    if (!isGroupChat) {
        if (sendOpenId < receiveOpenId) {
            roomID = sendOpenId + receiveOpenId
        } else {
            roomID = receiveOpenId+sendOpenId
        }
    } else {
        roomID = receiveOpenId
    }
    wx.connectSocket({
      url: api.ConnectSocket + App.globalData.openid +'/' +roomID,
      success() {
        socketOpen = true;
        that.initEventHandle()
      }
    })
  },
  getUsersChatDetail(openId,receiveOpenId) {
    var that = this
    wx.showLoading({
      title: '加载中',
    })
    wx.request({
        url: api.GetUsersChatDetail,
        data: {
          openid1:openId,
          openid2:receiveOpenId,
          region:app.globalData.region,
          campus:app.globalData.campus
        },
        header: {
          'content-type': 'json' // 默认值
        },
        success: function(res) {
          console.log(res.data);
          if (res.data.res.length > 0) {
            that.setData({
                // receiveAvatar:res.data.res[0].targetAvatar,
                list:res.data.res
            },function(){
                this.linkSocket();
                this.getScollBottom()
            })
          } else {
            that.setData({
                // receiveAvatar:res.data.res[0].targetAvatar,
                list:res.data.res
            },function(){
                this.linkSocket();
                this.getScollBottom()
            })
          }   
          wx.hideLoading()
        }
      })
  },

   initEventHandle() {
     wx.onSocketMessage((res) => {
      //接收到消息
      console.log("接收到消息"+JSON.stringify(res));
      let resJson = JSON.parse(res.data);
      var messageObj = {};
      messageObj.sendOpenId = resJson.openid;
      if(messageObj.sendOpenId === this.data.sendOpenId){
        //消息发送成功的回调，删除菊花即可。
        // for(let item in this.data.list){
        //   if(this.data.list[item].requestId === resJson.requestId){
        //     this.data.list[item].requestId = null;
        //     this.data.list[item].time = util.tsFormatTime(resJson.createdTime,'Y-M-D h:m');
        //     this.data.list[item].type = resJson.type
        //   }
        // }
        this.setData({
          list:this.data.list
        })
        return;
      }else{
        messageObj.content = resJson.content; //消息内容
        messageObj.targetOpenid = resJson.targetOpenid;//接收人的ID
        messageObj.openid = resJson.openid; //发送人的ID
        messageObj.region = app.globalData.region;
        messageObj.campus = app.globalData.campus;
        messageObj.avatar = resJson.avatar;
        //接受到对方的来信，渲染
        // messageObj.messageType = resJson.contentType;
        // messageObj.avatar = this.data.receiveAvatar
        // if(messageObj.messageType === 0){
        //   messageObj.content = JSON.parse(resJson.content);
        // }else if(messageObj.messageType === 1){//往预览图片的数组里加入一张图片
        //   this.data.imgList.push(resJson.content);
        //   messageObj.content = resJson.content;
        // }else{
        //   messageObj.content = resJson.content;
        // }
        this.data.list.push(messageObj);
        this.setData({
          list:this.data.list,
          // imgList:this.data.imgList
        },function(){
          this.getScollBottom();
        })
      }
    })
    wx.onSocketOpen(() => {
      console.log('WebSocket连接打开')
    })
    wx.onSocketError((res) => {
      console.log('WebSocket连接打开失败')
      this.reconnect()
    })
    wx.onSocketClose((res) => {
      console.log('WebSocket 已关闭！');
      socketOpen = false;
      if(this.data.isDisConnection){
        this.reconnect()
      }
    })
  },
  // 断线重连
  reconnect() {
    if (this.lockReconnect) return;
    this.lockReconnect = true;
    clearTimeout(this.timer)
    if (this.data.limit < 12) {
      this.timer = setTimeout(() => {
        this.linkSocket();
        this.lockReconnect = false;
      }, 5000);
      this.setData({
        limit: this.data.limit + 1
      })
      console.log("重新连接中："+this.data.limit);
    }
  },
  onkeyboardHeightChange(e) {
    const {height} = e.detail
    this.setData({
      keyboardHeight: height
    })
  },
  /**
   * 打开图片
   * @param {} event
   */
  preview:function(event){
    let currentUrl = event.currentTarget.dataset.src
    wx.previewImage({
      current:currentUrl,
      urls: this.data.imgList,
    })
  },
  /**
   * 显示表情区
   */
  showEmoji:function() {
    this.setData({
      functionShow: false,
      emojiShow:!this.data.emojiShow
    },function(){
        this.setData({
          keyboardHeight:(this.data.emojiShow==true)?300:0,
          paddingBottom:(this.data.emojiShow==true)?300:80
        },function(){
          this.getScollBottom();
        })
    })
  },
  /**
   * 显示发送图片区
   */
  showFunction:function() {
    this.setData({
      functionShow:!this.data.functionShow,
      isPaddingBottom:!this.data.functionShow,
      emojiShow: false
    },function(){
      this.setData({
        keyboardHeight:this.data.functionShow?200:0,
        paddingBottom:this.data.functionShow?200:80
      },function(){
        this.getScollBottom();
      })
    })
  },
  onFocus(e) {
    this.hideAllPanel()
    this.setData({
      paddingBottom:e.detail.height,
      keyboardHeight:e.detail.height,
    },function(){
      this.getScollBottom()
    })
  },
  onBlur(e) {
      this.setData({
        keyboardHeight:0,
        paddingBottom:80
      })
      this.data.cursor = (e && e.detail.cursor)?e.detail.cursor:0
  },
  onInput(e) {
    const value = e.detail.value
    this.data.comment = value
  },
  sendMessage() {
    var that = this
    let msg = this.data.comment;
      if (msg == "") {
        wx.showToast({
          title: '信息不能为空',
          icon: 'none',
          mask: true,
        });
        return;
    }
    let checkResult = check.checkString(msg,app.globalData.openid).then(function(result) {
        if (result) {
            that.onsend(0,msg)
            that.getScollBottom();
        } else {
            wx.showToast({
                title: '有违规内容！',
                icon: 'none',
                duration: 1500
            })
        }
    })
    // const parsedComment = this.parseEmoji(this.data.comment)
  },
  //消息发送前的处理
  onsend(type,message) {
    var that = this
    const obj = {};
    obj.content = message; //消息内容
    obj.targetOpenid = this.data.receiveOpenId;//接收人的ID
    obj.openid = this.data.sendOpenId; //发送人的ID
    obj.region = app.globalData.region
    obj.campus = app.globalData.campus
    obj.avatar = that.data.receiveAvatar
    console.log("1",socketOpen)
    if(!socketOpen){
      //如果链接没打开，则打开链接
      this.linkSocket()
      console.log("2",socketOpen)
    }
    //消息先加入聊天区域，此时菊花是转的
    this.data.list.push(obj);
    console.log(this.data.list)
    this.setData({
      comment: '',
      resource:'',
      giftSelected:null,
      popupFlag:true,
      list:this.data.list
    },function(){
      this.getScollBottom();
    })
    //非文本消息，先上传资源文件，在进行传输发送消息
    this.sendSocket(obj);
  },
  //socket发送消息
  sendSocket:function(obj){
    var that = this
    console.log("socketOpen",socketOpen)
    if (socketOpen) {
        // wx.onSocketOpen((result) => {
        //     console.log("result",result)
        //     wx.sendSocketMessage({
        //         data: JSON.stringify(obj),
        //         success(res) {
        //             console.log(res)
        //             console.log("打开socket")
        //         }
        //     })
        // })
        wx.sendSocketMessage({
            data: JSON.stringify(obj),
            success(res) {
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
                var c_time = util.formatTime(new Date())
                wx.request({
                    url: api.SendPMNotifXiaoyuan,
                    method:'GET',
                    data:{
                      openid: that.data.receiveOpenId,
                      page: "pages/notice/notice",
                      time: c_time,
                      campus:app.globalData.campus,
                      region:app.globalData.region,
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
            }
        })
 
    } else {

      wx.showToast({
        title: '链接已断,重新链接',
        icon: 'none',
        mask: true,
      });
    }
  },

  hideAllPanel() {
    this.setData({
      functionShow: false,
      emojiShow: false
    })
  },
  getScollBottom() {
      this.setData({'toLast':'toLast'})
    //   wx.pageScrollTo({ scrollTop: 100000,duration: 300})
  },

 
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    const that = this;
    wx.getSystemInfo({
      success({windowHeight}) {
        that.setData({
          windowHeight:windowHeight-App.globalData.navHeight-80
        })
        console.log(windowHeight);
      }
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // this.getScollBottom();
    var that = this
    var openId = that.data.sendOpenId
    var receiveOpenId = that.data.receiveOpenId
    var status = that.data.status
    console.log("status:",status)
    if (status == 0) {
        wx.showModal({
            title: '新的私聊邀请',
            content: '是否接受私聊邀请？',
            success (res) {
              if (res.confirm) {
                wx.request({
                    url: api.UpdateUserPMRequestStatus,
                    data: {
                      sender:openId,
                      receiver:receiveOpenId,
                      region:app.globalData.region,
                      campus:app.globalData.campus,
                      status:"1"
                    },
                    header: {
                      'content-type': 'json' // 默认值
                    },
                    success: function(res) {
                      console.log(res.data);  
                      Toast(res.data.msg); 
                      that.setData({
                        status:1
                      })
                    }
                })
              } else if (res.cancel) {
                wx.request({
                    url: api.UpdateUserPMRequestStatus,
                    data: {
                      sender:openId,
                      receiver:receiveOpenId,
                      region:app.globalData.region,
                      campus:app.globalData.campus,
                      status:"-1"
                    },
                    header: {
                      'content-type': 'json' // 默认值
                    },
                    success: function(res) {
                      console.log(res.data.msg); 
                      Toast(res.data.msg); 
                      wx.navigateBack()
                    }
                })
              }
            }
        })
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.setData({
      isDisConnection:true
    })
    wx.closeSocket()
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log("关闭");
    wx.closeSocket()
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    console.log("11111");
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  onPulling(e) {
    console.log('onPulling:', e)
  },

  onRefresh() {
    const that =this;
    if(this._noDataing){
      setTimeout(function() {
        that.setData({
          triggered: false
        })
      }, 500);
    }else{
      this.getUsersChatDetail(app.globalData.openid,this.data.receiveOpenId);
    }
  },

  onRestore(e) {
    console.log('onRestore:', e)
  },

  onAbort(e) {
    console.log('onAbort', e)
  },
  
  onChangeComment(e) {
    console.log(e)
    this.setData({
        comment:e.detail
    })

  }
})