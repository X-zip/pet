Component({
  data: {
    color: "rgb(139, 90, 43)",
    selectedColor: "rgb(139, 90, 43)",
    backgroundColor: "#ffffff",
    list: [
      {
        pagePath: "/pages/index/index",
        text: "宠友圈",
        iconPath: "/images/circle.png",
        selectedIconPath: "/images/circle_hl.png"
      },
      {
        pagePath: "/pages/group/group",
        text: "拼团",
        iconPath: "/images/group.png",
        selectedIconPath: "/images/group_hl.png",
        showDot: false
      },
      
      {
        pagePath: "/pages/post/post",
        bulge:true,
        iconPath: "/images/add.png",
        selectedIconPath: "/images/add_hl.png"
      },
      {
        pagePath: "/pages/service/service",
        text: "附近服务",
        iconPath: "/images/fuwu.png",
        selectedIconPath: "/images/fuwu_hl.png"
      },
      
      {
        pagePath: "/pages/usercenter/usercenter",
        text: "我的",
        iconPath: "/images/my.png",
        selectedIconPath: "/images/my_hl.png"
      }
    ]
  },
  attached() {
  },
  methods: {
    switchTab(e) {
      var that = this
      console.log(e)
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({url}) 
    }
  }
})