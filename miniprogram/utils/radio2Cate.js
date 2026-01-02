function ratioToCate(radio) {
      var cate = ""
      if (radio in ('radio10', 'radio11', 'radio12', 'radio13', 'radio14', 'radio15', 'radio16', 'radio17', 'radio18','radio20', 'radio19','radio21','跳蚤市场','闲置')){
          cate = "闲置"
      } else if (radio in ('radio6','radio4','radio40','radio41','radio42','radio43','情感交流','树洞')) {
          cate = "树洞"
      } else if (radio in ('短期兼职','求职资讯','radio5','求职')) {
          cate = "求职"
      } else if (radio in ('求助咨询','radio43','radio7','radio2','radio3','寻物招领','radio43','radio7','学习交流','求助')) {
          cate = "求助"
      }else if (radio in ('radio1','rent','owner','租房信息','租房')) {
          cate = "租房"
      }
      return cate;
    };
  
  module.exports = {
      ratioToCate: ratioToCate
  }
  
  
  
  