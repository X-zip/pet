Component({
    externalClasses: ['custom-class'], // 允许父级传入 custom-class 用于布局对齐
  
    properties: {
      /** 分类名，优先显示 text，否则用 cate */
      text: { type: String, value: '' },
      cate: { type: String, value: '' },
  
      /** 点击后是否自动跳转到子页面 */
      toSubpage: { type: Boolean, value: true },
  
      /** 是否展示左侧小图标与图标类型 */
      showIcon: { type: Boolean, value: true },
      icon: { type: String, value: 'arrow' },
  
      /** 禁用点击 */
      disabled: { type: Boolean, value: false }
    },
  
    methods: {
      onTap(e) {
        if (this.data.disabled) return;
        const cate = this.data.text || this.data.cate || '';
        if (!cate) return;
  
        if (this.data.toSubpage) {
          wx.navigateTo({
            url: `/pages/subpage/subpage?cate=${encodeURIComponent(cate)}`
          });
        } else {
          // 由父级自定义处理
          this.triggerEvent('tap', { cate });
        }
      }
    }
  });
  