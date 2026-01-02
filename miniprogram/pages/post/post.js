// pages/post/post.js
const app = getApp()
var util = require('../../utils/util.js')
var check = require('../../utils/check.js')
var checkImg = require('../../utils/checkImg.js')
const token = require('../../utils/qntoken.js')
const qiniuUploader = require("../../utils/qiniuUploader.js");
var api = require('../../config/api.js');
var CryptoJS = require('../../utils/aes.js')
import Toast from '@vant/weapp/toast/toast';

// post 发布页分类（按 UI 图固定；发布不包含“最新”）
const POST_CIRCLE_CATE_NAMES = ['闲置', '领养', '寻宠', '经验', '求助'];

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

// 格式化日期
function formatDate(date) {
    date = new Date(date);
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // ===== 导航栏高度 =====
    navBarHeight: 0,
    statusBarHeight: 0,

    // ===== 圈子发布数据 =====
    circleCheckedTreehole: false,
    circleCheckedAllCampus: false,
    circleChecked: false,
    circleCateList: [],
    circleFileList: [],
    circleActiveNames: ['2'],
    circleMessage: '',
    circleTags: [],
    circlePhone: false,

    // ===== 共享数据 =====
    uptoken: '',
    tokendata: null,
    cw: 0,
    ch: 0,
    campusName: '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    var that = this
    
    // 获取导航栏高度
    const systemInfo = wx.getSystemInfoSync();
    const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
    const navBarHeight = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height + systemInfo.statusBarHeight;
    that.setData({
      navBarHeight: navBarHeight,
      statusBarHeight: systemInfo.statusBarHeight,
    });

    // 加载草稿（如果有 draftId）- 仅圈子
    if (options.draftId) {
      that.loadDraft(options.draftId, 'circle');
    }
    that.initCircleData();
  },

  // 宠物活动发布入口已下线：不再提供 Tab 切换

  /**
   * 检查是否有未保存的更改（仅圈子）
   */
  hasUnsavedChanges() {
    return this.data.circleMessage.length > 0 ||
           this.data.circleFileList.length > 0 ||
           this.data.circleCateList.length > 0;
  },

  /**
   * 初始化圈子数据
   */
  initCircleData() {
    var that = this
    // 从全局 tags 中筛选并按固定顺序排序
    const allTags = (app.globalData.tags || []).slice(1); // 去掉“全部/最新”类占位
    const tagMap = new Map(allTags.map(t => [t.name, t]));
    var tags = POST_CIRCLE_CATE_NAMES
      .map((name) => {
        const t = tagMap.get(name);
        if (t) return { ...t };
        // 兜底：如果后端没返回该分类，仍展示一个默认图标
        return { name, img: 'images/icon/paw.png' };
      });

    for (var i = 0; i < tags.length; i++) {
      tags[i].isSel = 0
    }
    that.setData({
      circleTags: tags,
      circleCateList: []
    });
  },

  // 已移除：initGatherData（宠物活动发布入口已下线）

  /**
   * 保存草稿
   */
  saveDraft(type) {
    var draftKey = 'draft_post_' + type;
    var draftData = {};
    
    if (type === 'circle') {
      draftData = {
        message: this.data.circleMessage,
        fileList: this.data.circleFileList,
        cateList: this.data.circleCateList,
        checkedAllCampus: this.data.circleCheckedAllCampus
      };
    }
    
    wx.setStorageSync(draftKey, draftData);
  },

  /**
   * 加载草稿
   */
  loadDraft(draftId, type) {
    var draftKey = 'draft_post_' + (type || 'circle');
    var draftData = wx.getStorageSync(draftKey);
    
    if (draftData) {
      if (type === 'circle') {
        this.setData({
          circleMessage: draftData.message || '',
          circleFileList: draftData.fileList || [],
          circleCateList: draftData.cateList || [],
          circleCheckedAllCampus: draftData.checkedAllCampus || false
        });
      }
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    var that = this
    var campusName = wx.getStorageSync('campus')
    that.setData({ campusName })
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
    
    // 发布页仅保留圈子
    that.initCircleData();
    that.checkPhone(app.globalData.openid);
  },

  /**
   * 显示协议
   */
  showAgreement() {
    wx.navigateTo({
      url: '../uitem/rule/rule',
    })
  },

  /**
   * 表单重置
   */
  formReset() {
    // 重置圈子发布表单
    this.initCircleData();
    this.setData({
      circleMessage: '',
      circleFileList: [],
      circleChecked: false,
      circleCheckedAllCampus: false
    });
  },

  // ==================== 圈子发布相关方法 ====================

  selectTagCircle(event) {
    var that = this
    var tags = that.data.circleTags.slice() // 复制数组，避免直接修改
    var index = event.currentTarget.dataset.id
    var cateList = []
    
    // 单选逻辑：将所有分类设为未选中，然后选中当前点击的分类
    for (var i = 0; i < tags.length; i++) {
      tags[i].isSel = 0
    }
    tags[index].isSel = 1
    cateList.push(tags[index].name)
    
    that.setData({
      circleTags: tags,
      circleCateList: cateList,
    })
  },

  onChangeCheckCircle(event) {
    this.setData({
        circleChecked: event.detail,
    });
  },

  onChangeCateCircle(event) {
    this.setData({
      circleActiveNames: event.detail,
    });
  },

  onChangeAllCampus({ detail }) {
    this.setData({ circleCheckedAllCampus: detail });
  },

  deleteImgCircle(event) { 
    let index= event.detail.index 
    console.log(index)
    this.data.circleFileList.splice(index,1)
    this.setData({ circleFileList: this.data.circleFileList});
  },

  getPhoneNumberCircle (e) {
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
        if (res.data.res == -1) {
          wx.showToast({
            title: '请重试',
            icon:"none"
          })
        } else { 
          console.log(res.data.res)
          that.setData({
            circlePhone:true
          })
          app.globalData.phone = true
        }     
      }
    });
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
        console.log('phone:',res)
        if(res.data.res != -1) {
            app.globalData.phone = true
            that.setData({
                circlePhone:true
            })
        }
      }
    })
  },

  uploadCompressImg(file_url) {
    let that = this;
    console.log(file_url);
    return new Promise(function(resolve, reject) {
      // 获取原始图片大小
      wx.getImageInfo({
        src: file_url,
        success(res) {
          console.log(res);
          let originHeight = res.height;
          let originWidth = res.width;
          // 压缩比例
          // 最大尺寸限制
          let maxWidth = 800,
            maxHeight = 800;
          // 目标尺寸
          let targetWidth = originWidth,
            targetHeight = originHeight;
          // 等比例压缩，如果宽度大于高度，则宽度优先，否则高度优先
          if (originWidth > maxWidth || originHeight > maxHeight) {
            if (originWidth / originHeight > maxWidth / maxHeight) {
              // 要求宽度*(原生图片比例)=新图片尺寸
              targetWidth = maxWidth;
              targetHeight = Math.round(maxWidth * (originHeight / originWidth));
            } else {
              targetHeight = maxHeight;
              targetWidth = Math.round(maxHeight * (originWidth / originHeight));
            }
          }
  
          // 更新 canvas 大小
          that.setData({
            cw: targetWidth,
            ch: targetHeight
          });
  
          // 使用新的 Canvas 2D 接口
          wx.createSelectorQuery()
            .select('#canvas')
            .fields({ node: true, size: true })
            .exec((res) => {
              const canvas = res[0].node;
              const ctx = canvas.getContext('2d');
  
              // 设置画布大小
              canvas.width = targetWidth;
              canvas.height = targetHeight;
  
              // 创建图片对象
              const img = canvas.createImage();
              img.src = file_url;
              img.onload = () => {
                // 通过得到图片旋转的角度来调整显示方向以正确显示图片，主要解决 ios 系统上的图片会有旋转的问题
                let orientation = res.orientation;
                if (orientation == 'right') { // exif的6
                  ctx.rotate(90 * Math.PI / 180);
                  ctx.drawImage(img, 0, -targetHeight, targetWidth, targetHeight);
                } else {
                  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                }
  
                // 导出图片
                wx.canvasToTempFilePath({
                  canvas: canvas,
                  destWidth: targetWidth,
                  destHeight: targetHeight,
                  quality: 0.8,
                  fileType: "jpg",
                  success: (res) => {
                    console.log(res);
                    resolve(res.tempFilePath);
                  },
                  fail: (err) => {
                    console.error(err);
                    reject(err);
                  }
                });
              };
              img.onerror = (err) => {
                console.error(err);
                reject(err);
              };
            });
        },
        fail(err) {
          console.error(err);
          reject(err);
        }
      });
    });
  },

  //压缩并获取图片（圈子专用）
  afterReadCircle(event) {
    wx.showLoading({
        title: '正在上传图片...',
        mask: true
    })
    var that = this
    const { file } = event.detail;
    console.log(file.url)
    that.uploadCompressImg(file.url).then(res=>{
        console.log(res)
        wx.uploadFile({
            url: api.ImgCheck,
            filePath: res,
            name: 'file',
            header: {
              'content-type': 'multipart/form-data'
            },
            success: function(checkres) {
              console.log(JSON.parse(checkres.data))
              if (JSON.parse(checkres.data).errmsg == "ok") {
                  that.uploadCanvasImgCircle(file.url);
              } else if (JSON.parse(checkres.data).errcode == "40006") {
                  wx.showToast({
                      title: '图片太大！',
                      icon:'error'
                  })
                  wx.hideLoading()
              } else {
                  wx.showToast({
                      title: '图片违规！',
                      icon:'error'
                  })
                  wx.hideLoading()
              }
            },
          });
    })
  },

  //上传图片（圈子专用）
  uploadCanvasImgCircle: function(oriImg) {
      this.gettoken()
      this.uploadOriCircle(oriImg)
  },

  gettoken() {
    var tokendata = []
    tokendata.ak = 'wnkRCtmFWg7DZhCLjT72UOAT9WCdaI-TkPi8ncHr'
    tokendata.sk = '_8ZESS4_ZA0fqCMekohRgyVbWT01C7qi12Xj2OM7'
    tokendata.bkt = 'sinaporental'
    tokendata.cdn = ''
    this.data.tokendata = tokendata
    var uptoken = token.token(tokendata)
    this.setData({
      uptoken: uptoken
    })
  },

  uploadToQiniu(filePath, options = {}) {
    const { showLoading = true } = options
    this.gettoken()
    if (showLoading) {
      wx.showLoading({
        title: '正在上传图片...',
        mask: true
      })
    }
    return new Promise((resolve, reject) => {
      qiniuUploader.upload(
        filePath,
        (res) => {
          if (showLoading) {
            wx.hideLoading()
          }
          resolve('http://' + res.imageURL)
        },
        (error) => {
          if (showLoading) {
            wx.hideLoading()
          }
          reject(error)
        },
        {
          region: 'ASG',
          uptoken: this.data.uptoken,
          uploadURL: 'https://upload-as0.qiniup.com',
          domain: 'img.yqtech.ltd'
        }
      )
    })
  },

  uploadOriCircle(e) {
    console.log("url:",e)
    wx.showLoading({
      title: '正在上传图片...',
      mask: true
    })
    var that = this
    qiniuUploader.upload(
      e,
      (res) => {
        console.log(res)
        let url = 'http://' + res.imageURL;      
        const { circleFileList = [] } = this.data;
        circleFileList.push({ url: url });
        this.setData({ circleFileList });
        wx.hideLoading()
      },
      (error) => {
        console.log('error: ' + error);
        wx.hideLoading()
      }, {
        region: 'ASG',
        uptoken: that.data.uptoken,
        uploadURL: 'https://upload-as0.qiniup.com',
        domain: 'img.yqtech.ltd',
      },
      (progress) => {
      },
    )
  },

  formSubmitCircle: function(e) {
    var that = this
    let tmplIds=[];
    tmplIds[0] = app.globalData.template_id
    that.setData({
        circleChecked:true
    })
    wx.requestSubscribeMessage({
      tmplIds: tmplIds,
      success(res) {
        console.log(res.data)
        if (wx.getStorageSync('subNum')){
          var num = Number(wx.getStorageSync('subNum'))
          num +=1
          wx.setStorageSync('subNum', num)
        } else {
          wx.setStorageSync('subNum', 1)
        }
      }
    })
    var fileList = that.data.circleFileList
    var img_url = ""
    if (fileList.length > 0) {
        for (var i=0;i<fileList.length;i++) { 
            img_url = img_url + fileList[i].url
            if (i!=fileList.length-1) {
                img_url = img_url + ','
            } 
        }
    }
    console.log(img_url)
    var cateList = that.data.circleCateList
    var prepost = wx.getStorageSync('prepost')
    if (e.detail.value.content.length == 0) {
      Toast.fail('请填写正文！');
    } else if (cateList.length == 0) {
      Toast.fail('请选择圈子分类！');
    } else if (!that.data.circleChecked) {
      Toast.fail('请阅读并同意服务协议！');
    } else if (!app.globalData.phone){
      Toast.fail('手机号认证后才能发布！');
    } else if (prepost == e.detail.value.content) {
        Toast.fail('请不要发布重复内容！');
    } else {
      var that = this;
      Toast.loading({
        message: '加载中...',
        forbidClick: true,
        loadingType: 'spinner',
      });
      var userName = wx.getStorageSync('userName');
      var avatar = wx.getStorageSync('avatar');
        if(!userName || !avatar) {
            that.setData({
            circleCheckedTreehole:true
            })
        }
        if (that.data.circleCheckedTreehole) {
            const timestamp = Math.floor(Date.now() / 1000).toString().slice(-4);
            const picked = pickRandomAvatar(app.globalData.avatarList, timestamp);
            userName = picked.userName;
            avatar   = picked.avatar;
        }
        if (that.data.circleCheckedAllCampus) {
            var campus = "0"
        } else {
            var campus = app.globalData.campus
        }
      var content = e.detail.value.content
      let checkResult = check.checkString(content,app.globalData.openid).then(function(result) {
        console.log(result)
        if (result) {
          var key = '1234512345123456';
          var iv = '1234512345123456';
          key = CryptoJS.enc.Utf8.parse(key);
          iv = CryptoJS.enc.Utf8.parse(iv);
          var title = content
          var param = '{"content":"'+content+'","title":"'+title+'","verify":"zzyq",'+'"c_time":"'+ new Date() +'"}'
          var encrypted = CryptoJS.AES.encrypt(param, key, {
              iv: iv,
              mode: CryptoJS.mode.ECB,
              padding: CryptoJS.pad.Pkcs7
          });
          encrypted = encrypted.ciphertext.toString().toUpperCase();
          wx.request({
            url: api.AddTask,
            method:'POST',
            data: {
              c_time: new Date(),
              content: content,
              price: "",
              title: content.replace(/\s+/g,""),
              wechat: "",
              avatar: avatar,
              radioGroup: cateList[0],
              campusGroup: campus,
              userName: userName,
              img: img_url,
              cover:img_url,
              region: app.globalData.region,
              likeNum: 0,
              commentNum: 0,
              watchNum: 0,
              openid:app.globalData.openid,
              verify:"zzyqxxkj",
              encrypted:encrypted
            },
            header: {
              "Content-Type": "application/x-www-form-urlencoded" // 默认值
            },
            success (res) {
                wx.showToast({
                    title: '发布成功',
                })
                wx.setStorageSync('prepost', content)
                // 清除草稿
                wx.removeStorageSync('draft_post_circle')
              wx.switchTab({
                url: '../index/index',
              })

            },
          })
        } else {
          wx.showToast({
            title: '有违规内容！',
            icon: 'none',
            duration: 1500
          })
        }
      })
    }
  },

  // 已移除：宠物活动发布相关方法（入口已下线）

  toApplication() {
    wx.navigateTo({
      url: '../application/application',
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // 保存当前表单草稿
    if (this.hasUnsavedChanges()) {
      this.saveDraft('circle');
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 保存当前表单草稿
    if (this.hasUnsavedChanges()) {
      this.saveDraft('circle');
    }
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

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
  
})
