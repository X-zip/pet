// pages/detail/detail.js
var api = require('../../config/api.js');
const app = getApp()
import Toast from '@vant/weapp/toast/toast';
var CryptoJS = require('../../utils/aes.js')
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
        var that = this
        var pages = getCurrentPages();
        var page = pages[0].route
        console.log(page)
        console.log(options)
        var type = options.type
        var openid = app.globalData.openid
        var id = options.id
        that.setData({
            openid:openid,
            type:type,
            id:id
        })
        that.getTask(options.id)
    },

    getTask(id) {
        wx.request({
          url: api.GetTaskById,
          method: 'GET',
          data: { order_id: id },
          header: { 'content-type': 'application/json' },
          success: (res) => {
            const list = (res && res.data && res.data.taskList) || [];
            const task = list.length ? list[0] : null;
            if (!task) {
              console.warn('taskList 为空');
              this.setData({ task: null, isPublisher: false, isRider: false, s: '' });
              return;
            }
      
            // 规范化 img_url -> 数组
            if (task.img_url && String(task.img_url).trim() !== '') {
              task.img_url = String(task.img_url).split(',');
            } else {
              task.img_url = [];
            }
      
            // 计算角色与状态（注意把 status 转成字符串，便于 WXML 用 '0' 等比较）
            const isPublisher = this.data.openid === task.release_openid;
            const isRider = this.data.openid === task.pickup_openid;
      
            this.setData({
              task,
              isPublisher,
              isRider,
              s: String(task.status),
            });
          },
          fail: (e) => {
            console.error(e);
          },
        });
    },
      

    preview(e){
        console.log(e)
        var that = this
        wx.previewImage({
            current: e.currentTarget.dataset.id,
            urls: that.data.task.img_url,
        })
    },

    confirmPick() {
        wx.requestSubscribeMessage({
            tmplIds: ['v6gv9S4hOf61TjQy1uKVHXvN-YExmUlD4Aw8kKZzb0s'],
        })
        var that = this
        var openid = app.globalData.openid
        var order_id = that.data.task.order_id
        var key = '1234512345123456';
        var iv = '1234512345123456';
        key = CryptoJS.enc.Utf8.parse(key);
        iv = CryptoJS.enc.Utf8.parse(iv);
        var param = '{"openid":"'+openid+'","order_id":"'+order_id+'"}'
        var encrypted = CryptoJS.AES.encrypt(param, key, {
            iv: iv,
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        });
        encrypted = encrypted.ciphertext.toString().toUpperCase();
        wx.showModal({
          title: '确认接单',
          content: '请确保能够按时完成任务，多次违约将永久取消资格。',
          complete: (res) => {
            if (res.confirm) {
                wx.request({
                    url: api.UserPickupOrder,
                    method:'GET',
                    data: {
                        encrypted:encrypted
                    },
                    header: {
                      'content-type': 'application/json' // 默认值
                    },
                    success (res) {
                        console.log(res.data) 
                        if(res.data.code == '-2') {
                            Toast.fail('未注册为骑手');
                        } else if (res.data.code == '-1'){
                            Toast.fail('验证中，请等待通过');
                        }  else if (res.data.code == '-3'){
                            Toast.fail('有未完成订单!');
                        } else {
                            Toast.success('接单成功！');
                            that.getTask(that.data.id)
                            var id = that.data.id
                            wx.request({
                                url: api.RiderPickupSub,
                                method:'GET',
                                data: {
                                    page:"pages/group/group",
                                    order_id:order_id,
                                    template_id:"v6gv9S4hOf61TjQy1uKVHXvN-YExmUlD4Aw8kKZzb0s",
                                    region:app.globalData.region,
                                    campusGroup:app.globalData.campus
                                },
                                header: {
                                'content-type': 'application/json' // 默认值
                                },
                                success (res) {
                                    console.log(res)
                                }
                            })
                        }
                    },
                })
            }
          }
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

    payOrder() {
        var that = this
        var category = that.data.category
        console.log(that.data.task)
        wx.request({
            url: api.PayTask,
            method:'GET',
            data: {
              order_id:that.data.task.order_id,
              price:that.data.task.price,
              openid:app.globalData.openid,
              region:app.globalData.region,
              campusGroup:app.globalData.campus
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) { 
                console.log(res.data)
                wx.requestPayment({
                    appId:'wx0276ccc6a7c3959b',
                    nonceStr: res.data.msg.nonce_str,
                    package: 'prepay_id=' + res.data.msg.prepay_id,
                    paySign: res.data.msg.sign,
                    signType: 'MD5',
                    timeStamp: res.data.msg.timeStamp,
                    success:(res)=>{
                      console.log('success',res)
                    //   wx.request({
                    //     url: api.NewTaskSub,
                    //     method:'GET',
                    //     data: {
                    //         page:"/pages/group/group",
                    //         category:category,
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
                        wx.navigateBack()
                        wx.showToast({
                            title: '支付成功！',
                        })
                    },
                    fail(res){
                      console.log('failPay',res)
                      wx.switchTab({
                        url: '../group/group',
                      })
                    }
                })
                
            },
        })
    },

    finishOrder() {
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
            content: '请确保跑腿员已完成所有任务！',
            complete: (res) => {
              if (res.confirm) {
                wx.request({
                    url: api.OrderComplete,
                    method:'GET',
                    data: {
                        encrypted:encrypted,
                        region:app.globalData.region,
                        campusGroup:app.globalData.campus
                    },
                    header: {
                      'content-type': 'application/json' // 默认值
                    },
                    success (res) {
                        console.log(res.data.code) 
                        if(res.data.code == '200') {
                            Toast.success('订单已完成！');
                            var id = that.data.id
                            wx.request({
                                url: api.OrderCompleteSub,
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
                                    console.log(res)
                                }
                            })
                        } else {
                            Toast.fail('确认失败，请重试！');
                        }
                        that.getTask(that.data.id) 
                    },
                })
              }
            }
        })
    },

    // riderFinish() {
    //     var that = this
    //     var order_id = that.data.task.order_id
    //     console.log(order_id)
    //     wx.showModal({
    //         title: '确认完成',
    //         content: '请确认已完成任务！',
    //         complete: (res) => {
    //           if (res.confirm) {
    //             wx.request({
    //                 url: api.OrderCompleteByRider,
    //                 method:'GET',
    //                 data: {
    //                     order_id:order_id,
    //                     region:app.globalData.region,
    //                     campusGroup:app.globalData.campus
    //                 },
    //                 header: {
    //                   'content-type': 'application/json' // 默认值
    //                 },
    //                 success (res) {
    //                     console.log(res.data.code) 
    //                     if(res.data.code == '200') {
    //                         Toast.success('订单已完成，请提醒发布者确认！');
    //                     } else {
    //                         Toast.fail('确认失败，请重试！');
    //                     }   
    //                     that.getTask(that.data.id)
    //                 },
    //             })
    //           }
    //         }
    //     })
    // },

    getMoney() {
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
            title: '确认提现',
            content: '确定现在提现？',
            complete: (res) => {
              if (res.confirm) {
                wx.request({
                    url: api.RiderWithdrawal,
                    method:'GET',
                    data: {
                        encrypted:encrypted,
                        region:app.globalData.region,
                        campusGroup:app.globalData.campus
                    },
                    header: {
                      'content-type': 'application/json' // 默认值
                    },
                    success (res) {
                        console.log(res.data) 
                        if(res.data.code == '200') {
                            // Toast.success('订单已完成！');
                            if (wx.canIUse('requestMerchantTransfer')) {
                                wx.requestMerchantTransfer({
                                  mchId: res.data.mchId,
                                  appId: wx.getAccountInfoSync().miniProgram.appId,
                                  package: res.data.package_info,
                                  success: r => {
                                    console.log('opened & returned:', r); // 仅表示组件返回
                                    wx.request({
                                        url: api.RiderWithdrawalComplete,
                                        method:'GET',
                                        data: {
                                            encrypted:encrypted,
                                            region:app.globalData.region,
                                            campusGroup:app.globalData.campus
                                        },
                                        header: {
                                          'content-type': 'application/json' // 默认值
                                        },
                                        success (res) {
                                            console.log(res.data.code) 
                                            if(res.data.code == '200') {
                                                Toast.success(res.data.msg);
                                            } else {
                                                Toast.fail(res.data.msg);
                                            }   
                                        },
                                    })
                                  },
                                  fail: e => {
                                    console.log('user cancel or error:', e); // e.errMsg 可能含 cancel
                                  },
                                  complete: () => {
                                    // 无论成功/失败/取消，都去服务端查最终转账状态
                                    console.log('user complete')
                                  }
                                });
                            } else {
                            wx.showModal({
                                content: '你的微信版本过低，请更新至最新版本。',
                                showCancel: false,
                            });
                            }
                        } else {
                            Toast.fail('确认失败，请重试！');
                        }
                        that.getTask(that.data.id) 
                    },
                })
              }
            }
        })
    },

    cancelOrder() {
        var that = this
        var openid = app.globalData.openid
        var paid_price = that.data.task.price
        var order_id = that.data.task.order_id
        console.log(order_id)
        wx.showModal({
            title: '确认取消',
            content: '取消后，会立刻退款到您的微信！',
            complete: (res) => {
              if (res.confirm) {
                wx.request({
                    url: api.CancelTask,
                    method:'GET',
                    data: {
                        order_id:order_id,
                        openid:openid,
                        paid_price:paid_price,
                        region:app.globalData.region,
                        campusGroup:app.globalData.campus
                    },
                    header: {
                      'content-type': 'application/json' // 默认值
                    },
                    success (res) {
                        console.log(res.data.code) 
                        if(res.data.code == '200') {
                            Toast.success('取消成功！');
                        } else {
                            Toast.fail('取消失败，请重试！');
                        }   
                        that.getTask(that.data.id)
                    },
                })
              }
            }
        })
    },

    goOrder() {
        console.log('1')
        wx.navigateBack()
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
    // onShareAppMessage: function() {
    //     var that=this
    //         wx.showShareMenu({
    //       withShareTicket: true,
    //       menus: ['shareAppMessage', 'shareTimeline']
    //     })
    //     var price = ''
    //     if (that.data.task[0].price){
    //       price = "【SGD " + that.data.task[0].price + "】"
    //     }
    //     return {
    //       title: price + that.data.task[0].title,
    //     }
    // },
      
    //     //用户点击右上角分享朋友圈
    // onShareTimeline: function () {
    //     var that = this
    //     console.log(that.data.img)
    //     if (that.data.img[0] != '') {
    //       return {
    //           title: that.data.task[0].title,
    //           imageUrl: that.data.img[0]
    //         }
    //     } else {
    //       return {
    //           title: that.data.task[0].title,
    //           imageUrl: 'https://img.yqtech.ltd/macao/logo/anyway.jpg'
    //         }
    //     }
    
    // },
})