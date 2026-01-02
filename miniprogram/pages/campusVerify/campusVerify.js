var api = require('../../config/api.js');
const app = getApp()
Page({
    data: {
      emailUser: '',
      emailDomain: '@um.edu.mo',
      emailDomains: [
        "@connect.um.edu.mo","@um.edu.mo", "@must.edu.mo",
        "@mpu.edu.mo","@cityu.edu.mo","@utm.edu.mo",
      ],
      showPicker: false,
      sentCode: '',
      emailCode: '',
      countdown: 0,
      verificationStatus: null
    },
  
    // 输入邮箱前缀
    onEmailUserInput(e) {
      this.setData({ emailUser: e.detail });
    },
  
    // 打开邮箱后缀选择器
    onPickDomain() {
      this.setData({ showPicker: true });
    },
  
    // 选择邮箱后缀
    onDomainConfirm(e) {
      const domain = e.detail.value;
      this.setData({
        emailDomain: domain,
        showPicker: false
      });
    },
  
    // 关闭选择器
    onClosePicker() {
      this.setData({ showPicker: false });
    },
  
    // 输入验证码
    onCodeInput(e) {
      this.setData({ emailCode: e.detail });
    },
  
    // 发送邮箱验证码
    sendEmailCode() {
      const { emailUser, emailDomain, countdown } = this.data;
      if (!emailUser) {
        wx.showToast({ title: '请输入邮箱前缀', icon: 'none' });
        return;
      }
      if (countdown > 0) return;
  
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const email = `${emailUser}${emailDomain}`;
      this.setData({ sentCode: code });
  
      wx.request({
        url: api.SendEmailCode, // 替换为你实际的后端接口
        method: 'GET',
        data: {
          code:code,
          email:email
        },
        success: () => {
          wx.showToast({ title: '验证码已发送', icon: 'success' });
          this.startCountdown();
        },
        fail: () => {
          wx.showToast({ title: '发送失败', icon: 'none' });
        }
      });
    },
  
    // 倒计时逻辑
    startCountdown() {
      let count = 60;
      this.setData({ countdown: count });
      const timer = setInterval(() => {
        count--;
        this.setData({ countdown: count });
        if (count <= 0) clearInterval(timer);
      }, 1000);
    },
  
    // 验证邮箱验证码
    verifyEmailCode() {
      const { emailCode, sentCode } = this.data;
      if (emailCode.length !== 6) {
        wx.showToast({ title: '请输入6位验证码', icon: 'none' });
        return;
      }
      var that = this
      const verified = emailCode === sentCode;
      if (verified) {
        wx.request({
            url: api.SetIdentityXiaoyuan,
            method:'GET',
            data: {
              openid: app.globalData.openid,
              identity:"3"
            },
            header: {
              'content-type': 'application/json' // 默认值
            },
            success (res) {
                that.setData({ verificationStatus: verified });
                wx.showToast({
                  title: '验证成功',
                  icon: 'success'
                });
            },
          })
      } else {
        wx.showToast({
            title: '验证码错误',
            icon: 'none'
          });
      }
    }
  });
  
  