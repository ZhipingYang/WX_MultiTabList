// pages/myCoupon/myCoupon.js

let staticPageNumber = 20;

// 分页 list
class TabItem {
  constructor(title) {
    this.title = title;            // 标题
    this.list = [];                // 数据列表
    this.placeholder = "点击刷新";  // 占位提示（刷新、网络错误、空白）
    this.load_type = 0;            // 0表示不显示，1表示加载中，2表示已加载全部
  }
}

// 数据item
class ListItem {
  constructor() {
    this.image_url = "../../assets/image/coupon_item_icon.png";
    this.price = ListItem.randomNumber(5, 100);
    this.title = this.price + "元红包";
    this.date = ListItem.randomNumber(2017, 2020) + "-03-02";
  }
  static randomNumber(min, max) {
    return parseInt(Math.random() * (max - min) + min);
  }
}

// 空白页tip
function getEmptyTip(index) {
  return ["无可使用优惠券", "无已使用优惠券", "无已失效的优惠券"][index % 3];
}

// 假数据
function getFakeData(num = staticPageNumber) {
  var list = [];
  for (let i = 0; i < num; i++) {
    let item = new ListItem()
    list.push(item)
  }
  return list;
}

Page({
  data: {
    tabs: [
      new TabItem("可使用的"),
      new TabItem("已使用的"),
      new TabItem("已失效的")
    ],
    stv: {
      windowWidth: 0,
      lineWidth: 0,
      offset: 0,
      tStart: false
    },
    activeTab: 0,
  },

  onLoad: function (options) {
    try {
      let { tabs } = this.data;
      var res = wx.getSystemInfoSync()
      this.windowWidth = res.windowWidth;
      this.data.stv.lineWidth = res.windowWidth / this.data.tabs.length;
      this.data.stv.windowWidth = res.windowWidth;
      this.setData({ stv: this.data.stv })
      this.tabsCount = tabs.length;
    } catch (e) {
      // 
    }
  },

  onShow: function () {
    this.loadCouponsAtIndexRefresh();
  },

  loadCouponsAtIndexRefresh(index = 0, isRefresh = true) {

    // loading
    wx.showLoading({
      title: '加载中',
    });

    // 显示加载更多
    if (!isRefresh) {
      // 已经加载全部，则不再请求
      let config = this.data.tabs[index];

      // 已经全部加载完毕
      if (!config.load_type == 2) {
        return;
      }

      var tabs = this.data.tabs;
      tabs[index].load_type = 1;
      this.setData({
        tabs: tabs
      })
    }

    setTimeout(() => {
      let res = {
        data: { code: 1 }
      };

      // fake
      res.list = getFakeData(Math.random() > 0.5 ? 6 : staticPageNumber);

      wx.hideLoading();

      let that = this;
      let item = that.data.tabs[index];
      var tips = item.placeholder;
      var list = item.list;

      // 请求成功
      if (res.data.code == 1) {
        if (res.list && res.list.length > 0) {
          if (isRefresh) {
            list = res.list;
          } else {
            list.push(...res.list);
          }

          // 加载更多
          var tabs = this.data.tabs;
          tabs[index].load_type = res.list.length < staticPageNumber ? 2 : 0;
          tabs[index].list = list;

          that.setData({
            tabs: tabs
          })
          return;
        } else {
          tips = getEmptyTip(index);
        }
      } else {
        tips = res.msg.length > 0 ? res.msg : "网络错误";
      }
      tips += " 点击刷新";

      var tabs = this.data.tabs;
      tabs[index].placeholder = tips;

      that.setData({
        tabs: tabs
      })

    }, 600);
  },

  // 加载更多
  loadMore(e) {
    let currentIndex = e.currentTarget.dataset.index;
    let currentTab = this.data.tabs[currentIndex];
    if (currentTab.list.length > 0 && currentTab.load_type != 2) {
      this.loadCouponsAtIndexRefresh(currentIndex, false);
    }
  },

  // 刷新
  refresh(e) {
    let currentIndex = e.currentTarget.dataset.index;
    let currentTab = this.data.tabs[currentIndex];
    if (currentTab.list.length <= 0) {
      this.loadCouponsAtIndexRefresh(currentIndex);
    }
  },

  // 手势开始
  handlerStart(e) {
    let { clientX, clientY } = e.touches[0];
    this.startX = clientX;
    this.tapStartX = clientX;
    this.tapStartY = clientY;
    this.data.stv.tStart = true;
    this.tapStartTime = e.timeStamp;
    this.setData({ stv: this.data.stv })
  },

  // 手势移动
  handlerMove(e) {
    let { clientX, clientY } = e.touches[0];
    let { stv } = this.data;
    let offsetX = this.startX - clientX;
    this.startX = clientX;
    stv.offset += offsetX;
    if (stv.offset <= 0) {
      stv.offset = 0;
    } else if (stv.offset >= stv.windowWidth * (this.tabsCount - 1)) {
      stv.offset = stv.windowWidth * (this.tabsCount - 1);
    }
    this.setData({ stv: stv });
  },

  // 手势取消
  handlerCancel(e) {

  },

  // 滑动手势完成
  handlerEnd(e) {
    let { clientX, clientY } = e.changedTouches[0];
    // 如果是点击手势，则屏蔽当前手势的事件处理
    if (Math.abs(this.tapStartX - clientX) < 1 && Math.abs(this.tapStartY - clientY) < 1) {
      return;
    }
    // 阻止干预scrollview的上下滑动体验
    if (Math.abs(this.data.stv.offset - 0) < 1 || Math.abs(this.data.stv.offset - this.data.windowWidth) < 1) {
      return;
    }
    let endTime = e.timeStamp;
    let { tabs, stv, activeTab } = this.data;
    let { offset, windowWidth } = stv;

    //快速滑动
    if (endTime - this.tapStartTime <= 300) {
      //向左
      if (Math.abs(this.tapStartY - clientY) < 50) {
        if (this.tapStartX - clientX > 5) {
          if (activeTab < this.tabsCount - 1) {
            let page = ++activeTab;
            this.reloadPageIfEmpty(page);
            this.setData({ activeTab: page })
          }
        } else {
          if (activeTab > 0) {
            let page = --activeTab;
            this.reloadPageIfEmpty(page);
            this.setData({ activeTab: page })
          }
        }
        stv.offset = stv.windowWidth * activeTab;
      } else {
        //快速滑动 但是Y距离大于50 所以用户是左右滚动
        let page = Math.round(offset / windowWidth);
        if (activeTab != page) {
          this.setData({ activeTab: page })
          this.reloadPageIfEmpty(page);
        }
        stv.offset = stv.windowWidth * page;
      }
    } else {
      let page = Math.round(offset / windowWidth);

      if (activeTab != page) {
        this.setData({ activeTab: page })
        this.reloadPageIfEmpty(page);
      }
      stv.offset = stv.windowWidth * page;
    }

    stv.tStart = false;
    this.setData({ stv: this.data.stv })
  },

  // item点击
  itemTap(e) {
    console.log(e);
  },

  // 更新选中的page
  updateSelectedPage(page) {
    // 屏蔽重复选中
    if (this.data.activeTab == page) {
      return;
    }
    let { tabs, stv, activeTab } = this.data;
    activeTab = page;
    this.setData({ activeTab: activeTab })
    stv.offset = stv.windowWidth * activeTab;
    this.setData({ stv: this.data.stv })
    this.reloadPageIfEmpty(page);
  },

  reloadPageIfEmpty(page) {
    // 重新请求
    if (this.data.tabs[page].list.length <= 0) {
      this.loadCouponsAtIndexRefresh(page);
    }
  },

  // item view 点击
  handlerTabTap(e) {
    this.updateSelectedPage(e.currentTarget.dataset.index);
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: `准确极速、支持全国`,
      desc: '准确极速、覆盖全国、1.4亿车主都在用',
      path: '/pages/myCoupon/myCoupon'
    }
  },
})