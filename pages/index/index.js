//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    motto: '点击查看',
  },
  //事件处理函数
  goto_multi_list(e) {
    wx.navigateTo({
      url: '../myCoupon/myCoupon',
    })
  }
})
