// pages/help/help.js
import Toast from '@vant/weapp/toast/toast';
const app = getApp()
var api = require('../../config/api.js');
var check = require('../../utils/check.js')
var checkImg = require('../../utils/checkImg.js')
const token = require('../../utils/qntoken.js')
const qiniuUploader = require("../../utils/qiniuUploader.js");
Page({

    /**
     * 页面的初始数据
     */
    data: {
        count:1,
        showTime:false,
        showDate:false,
        currentTime: '12:00',
        fileList: [],
        showAgreement:false,
        fee:3,
        weight:1,
        checked:false,
        activeNames:['2'],
        tags:[{"name":"代取","img":"",isSel:0},
        {"name":"代寄","img":"",isSel:0},
        {"name":"代买","img":"",isSel:0},
        {"name":"其他","img":"",isSel:0},
        ],
        cateList:[],
    },
    

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        // 重定向到统一发布页
        var url = '../post/post?type=errand';
        if (options.draftId) {
            url += '&draftId=' + options.draftId;
        }
        wx.redirectTo({
            url: url
        });
    },

    onChangeCate(event) {
        this.setData({
          activeNames: event.detail,
        });
    },

    selectTag(event) {
        console.log(event.currentTarget.dataset.id)
        var that = this
        var tags = that.data.tags
        var index = event.currentTarget.dataset.id
        var cateList = that.data.cateList
        console.log(cateList.length)
        if (cateList.length>0) {
          for (var i=0;i<tags.length;i++) { 
            tags[i].isSel = 0
            cateList.push(tags[i].name)
          }
          cateList = []
        }
        tags[index].isSel = 1
        cateList.push(tags[index].name)
        that.setData({
          isAll:0,
          tags:tags,
          cateList:cateList,
        })
        console.log(that.data.cateList)
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

    },
    onChangeCount(event) {
        Toast.loading({ forbidClick: true });
        setTimeout(() => {
          Toast.clear();
          this.setData({ count:event.detail });
        }, 500);
    },

    onChangeWeight(event) {
        Toast.loading({ forbidClick: true });
        setTimeout(() => {
          Toast.clear();
          this.setData({ weight:event.detail });
        }, 500);
    },

    onChangeFee(event) {
        Toast.loading({ forbidClick: true });
        setTimeout(() => {
          Toast.clear();
          this.setData({ fee:event.detail });
        }, 500);
    },

    deleteImg(event) { 
        let index= event.detail.index 
        console.log(index)
        this.data.fileList.splice(index,1)
        this.setData({ fileList: this.data.fileList});
    },

    
    onChangeCheck(event) {
        this.setData({
            checked: event.detail,
        });
    },

    showAgreement() {
        this.setData({ showAgreement: true });
    },
    onCloseAgreement() {
        this.setData({ showAgreement: false });
    },
    
    onDisplayDate() {
        this.setData({ showDate: true });
    },
    onCloseDate() {
        this.setData({ showDate: false });
    },
    formatDate(date) {
        date = new Date(date);
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
    },
    onConfirmDate(event) {
        console.log(event.detail)
        this.setData({
            showDate: false,
            date: this.formatDate(event.detail),
        });
    },
    onDisplayTime() {
        this.setData({ showTime: true });
    },
    onCloseTime() {
        this.setData({ showTime: false });
    },
    onInputTime(event) {
        console.log(event.detail)
        this.setData({
            currentTime: event.detail,
            showTime: false
        });
    },

    //压缩并获取图片，这里用了递归的方法来解决canvas的draw方法延时的问题
    afterRead(event) {
        wx.showLoading({
            title: '正在上传图片...',
            mask: true
        })
        var that = this
        const { file } = event.detail;
        // 当设置 mutiple 为 true 时, file 为数组格式，否则为对象格式
        wx.uploadFile({
          url: api.ImgCheck,
          filePath: file.url,
          name: 'file',
          header: {
            'content-type': 'multipart/form-data'
          },
          success: function(checkres) {
            console.log(JSON.parse(checkres.data))
            if (JSON.parse(checkres.data).errmsg == "ok") {
                that.uploadCanvasImg(file.url);
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
    },
    //上传图片
    uploadCanvasImg: function(oriImg) {
        this.gettoken()
        this.uploadOri(oriImg)
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
        //console.log('uptoken', uptoken, this.data.tokendata)
      },

    uploadOri(e) {
        // await this.gettoken()//获取token需要用到 不用await记得吧async取消
        console.log("url:",e) //传入的地址
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
            const { fileList = [] } = this.data;
            fileList.push({ url: url });
            this.setData({ fileList });
            wx.hideLoading()
          },
          (error) => { //回调 fail
            console.log('error: ' + error);
            wx.hideLoading()
          }, {
            // 参数设置  地区代码 token domain 和直传的链接 注意七牛四个不同地域的链接不一样，我使用的是华南地区
            region: 'ASG',
            // ECN, SCN, NCN, NA, ASG，分别对应七牛的：华东，华南，华北，北美，新加坡 5 个区域
            uptoken: that.data.uptoken, //上传凭证自己生成
            uploadURL: 'https://upload-aso.qiniup.com', //下面选你的区z2是华南的
            domain: 'img.yqtech.ltd', //cdn域名建议直接写出来不然容易出异步问题如domain:‘你的cdn’
          },
          (progress) => {
    
          },
        )
    },

    showAgreement() {
        wx.navigateTo({
          url: '../uitem/rule/rule',
        })
    },

    formSubmit: function(e) {
        wx.requestSubscribeMessage({
            tmplIds: ['v6gv9S4hOf61TjQy1uKVHXvN-YExmUlD4Aw8kKZzb0s','Q8ChNF82pUhYUzoM0lEbe4k1wCgcFLYlodRsoSK_amk'],
        })
        console.log(e)
        wx.showToast({
          title: '支付中',
          icon: 'loading',
          mask:true
        })
        var that =this
        var date = that.data.date
        var currentTime = that.data.currentTime
        var fee = that.data.fee
        var fileList = that.data.fileList
        var amount = that.data.count
        var weight = that.data.weight
        var img_url = ""
        var catogory = that.data.cateList[0]
        if (fileList.length > 0) {
            for (var i=0;i<fileList.length;i++) { 
                img_url = img_url + fileList[i].url
            }
        }
        console.log(img_url)
        console.log(catogory,date,amount,weight,currentTime,fee,e.detail.value.address_from,e.detail.value.address_to,e.detail.value.message.length,e.detail.value.phone,e.detail.value.wechat,e.detail.value.name)
        if (catogory == undefined || date.length == 0 || (catogory != '其他' && amount.length== 0) || (catogory != '其他' && weight.length== 0) || currentTime.length == 0 || fee.length == 0 ||  ((catogory == '代取' || catogory == '代寄' ) && e.detail.value.address_from.length == 0) || ((catogory == '代取' || catogory == '代寄') && e.detail.value.address_to.length == 0) || e.detail.value.message.length == 0 || e.detail.value.phone.length == 0 || e.detail.value.wechat.length == 0 || e.detail.value.name.length == 0) {
            wx.showToast({
                title: '请补全信息！',
                icon: 'none',
                duration: 1500
              })
        } else if (!that.data.checked) {
            wx.showToast({
                title: '请阅读并同意服务协议！',
                icon: 'none',
                duration: 1500
            })
        } else {
            var address_from=""
            if(e.detail.value.address_from) {
                address_from=e.detail.value.address_from
            }
            var address_to=""
            if(e.detail.value.address_to) {
                address_to=e.detail.value.address_to
            }
            wx.request({
                url: api.AddTaskPaotui,
                method:'GET',
                data: {
                  category:catogory,
                  address_from:address_from,
                  address_to:address_to,
                  due_date:date,
                  due_time:currentTime,
                  description:e.detail.value.message,
                  content:"",
                  price:fee,
                  release_openid:app.globalData.openid,
                  img_url:img_url,
                  release_phone:e.detail.value.phone,
                  release_wechat:e.detail.value.wechat,
                  release_name:e.detail.value.name,
                  amount:amount,
                  weight:weight,
                  region:app.globalData.region,
                  campusGroup:app.globalData.campus
                },
                header: {
                  'content-type': 'application/json' // 默认值
                },
                success (res) { 
                    if (res.data.code == 200) {
                        var order_id = res.data.msg.order_id
                        wx.requestPayment({
                            appId:app.globalData.appId,
                            nonceStr: res.data.msg.nonce_str,
                            package: 'prepay_id=' + res.data.msg.prepay_id,
                            paySign: res.data.msg.sign,
                            signType: 'MD5',
                            timeStamp: res.data.msg.timeStamp,
                            success:(r)=>{
                              console.log('success',r)
                            //   wx.request({
                            //     url: api.NewTaskSub,
                            //     method:'GET',
                            //     data: {
                            //         page:"/pages/group/group",
                            //         category:catogory,
                            //         address_to:e.detail.value.address_to,
                            //         order_id:order_id,
                            //         template_id:"uXBSsSjX84kuCFeE8ae04iZ9Wl88CqAAy2HmupZPGKk",
                            //         region:app.globalData.region,
                            //         campusGroup:app.globalData.campus
                            //     },
                            //     header: {
                            //     'content-type': 'application/json' // 默认值
                            //     },
                            //     success (res) {
                            //         console.log(res)
                            //         wx.navigateBack()
                            //         wx.showToast({
                            //             title: '支付成功！',
                            //         })
                                    
                            //     }
                            //   })
                                wx.request({
                                    url: api.PaySuccess,
                                    method:'GET',
                                    data: {
                                        order_id:order_id
                                    },
                                    header: {
                                      'content-type': 'application/json' // 默认值
                                    },
                                    success (res) {
                                        wx.navigateBack()
                                        wx.showToast({
                                            title: '支付成功！',
                                        })
                                    }
                                })
                            },
                            fail(res){
                              console.log('failPay',res)
                              wx.switchTab({
                                url: '../group/group',
                              })
                            }
                        })
                    } else {
                        wx.showToast({
                            title: '时间已过期',
                            icon:"none"
                        })  
                    }
                },
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
        
    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})