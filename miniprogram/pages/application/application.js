// pages/application/application.js
const app = getApp()
var api = require('../../config/api.js');
const token = require('../../utils/qntoken.js')
const qiniuUploader = require("../../utils/qiniuUploader.js");
import Toast from '@vant/weapp/toast/toast';
Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {
        wx.showToast({
            title: "检测中",
            icon:"loading",
            mask:true,
            duration:2000
        })
        wx.request({
          url: api.GetRiderByOpenid,
          method:'GET',
                data: {
                    openid:app.globalData.openid,
                },
                success (res) {
                    if (res.data.code != '200') {
                        wx.navigateBack()
                        wx.showToast({
                            title: res.data.msg,
                            icon:"error",
                            mask:true,
                            duration:2000
                        })
                    }
                }
        })

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

    onChangeName (e) {
        var that = this
        that.setData({
            name:e.detail
        })
    },

    onChangeWechat (e) {
        var that = this
        that.setData({
            wechat:e.detail
        })
    },

    onChangePhone (e) {
        var that = this
        that.setData({
            phone:e.detail
        })
    },

    onChangeCampus (e) {
        var that = this
        that.setData({
            campus:e.detail
        })
    },

    onChangeSchool (e) {
        var that = this
        that.setData({
            school:e.detail
        })
    },

    onChangeYear (e) {
        var that = this
        that.setData({
            year:e.detail
        })
    },

    onChangePassport (e) {
        var that = this
        that.setData({
            passport:e.detail
        })
    },

    deleteImg(event) { 
        let index= event.detail.index
        var name = event.detail.name
        console.log(index)
        if (name=="student") {
            this.data.fileListStudent.splice(index,1)
            this.setData({ fileListStudent: this.data.fileListStudent});
        } else if (name=="front") {
            this.data.fileListFront.splice(index,1)
            this.setData({ fileListFront: this.data.fileListFront});
        } else if (name=="back") {
            this.data.fileListBack.splice(index,1)
            this.setData({ fileListBack: this.data.fileListBack});
        }    
    },

    //压缩并获取图片，这里用了递归的方法来解决canvas的draw方法延时的问题
    afterRead(event) {
        console.log(event)
        var name = event.detail.name
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
                that.uploadCanvasImg(file.url,name);
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
          }
        });
    },
    //上传图片
    uploadCanvasImg: function(oriImg,name) {
        this.gettoken()
        this.uploadOri(oriImg,name)
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

    uploadOri(e,name) {
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
            console.log("res:",res.imageURL)
            let url = 'http://' + res.imageURL;  
            if (name=="student") {
                const { fileListStudent = [] } = this.data;
                fileListStudent.push({ url: url });
                this.setData({ fileListStudent });
            } else if (name=="front") {
                const { fileListFront = [] } = this.data;
                fileListFront.push({ url: url });
                this.setData({ fileListFront });
            } else if (name=="back") {
                const { fileListBack = [] } = this.data;
                fileListBack.push({ url: url });
                this.setData({ fileListBack });
            }       
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

    submitApplication () {
        wx.showLoading({
          title: '发送中',
        })
        wx.requestSubscribeMessage({
            tmplIds: ['BE1006H5MCzT_7DOdfyAeji1xm84I7eVLequ_qxEaj4'],
        })
        var that = this
        const { name, phone, wechat, campus, school, passport, fileListStudent, fileListFront } = this.data;
        if (
        [name, phone, wechat, campus, school, passport].some(v => !v || !String(v).trim()) ||
        !Array.isArray(fileListStudent) || fileListStudent.length === 0 ||
        !Array.isArray(fileListFront)   || fileListFront.length === 0
        ) {
            wx.showToast({ title: '请补全信息！', icon: 'none', duration: 1500 });
            return;
        } else {
            wx.request({
                url: api.AddUserInfo,
                method:'GET',
                data: {
                    openid:app.globalData.openid,
                    realname:name,
                    phone:phone,
                    wechat:wechat,
                    campus:campus,
                    school:school,
                    ic_number:passport,
                    student_card_pic:fileListStudent[0].url,
                    ic_pic_front:fileListFront[0].url,
                    ic_pic_back:"",
                    region:app.globalData.region,
                    campusGroup:app.globalData.campus
                },
                success (res) {
                    // wx.hideLoading()
                    if (res.data.code == "-1") {
                        Toast.fail('该手机号已注册，请联系客服修改');
                    } else if (res.data.code == "-2") {
                        Toast.fail('该微信号已注册，请联系客服修改');
                    } else if (res.data.code == "-3") {
                        Toast.fail('该证件已注册，请联系客服修改');
                    } else if (res.data.code == "200") {
                        Toast.success('添加成功，等待系统审核');
                        wx.switchTab({
                          url: '../usercenter/usercenter',
                        })
                    } else {
                        Toast.fail('系统错误请重试');
                    } 
                }
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