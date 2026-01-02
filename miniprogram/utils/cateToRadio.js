function cateToRadio(cateList,isAll) {
  if (isAll == 1) {
    var radioList = ['radio10', 'radio11', 'radio12', 'radio13', 'radio14', 'radio15', 'radio16', 'radio17', 'radio18','radio20', 'radio19','radio21','闲置','radio5','求职','radio6','radio4','radio40','radio41','radio42','树洞','求助','求职资讯','radio5','求助咨询','radio43','radio7','radio6','radio4','radio40','radio41','radio42','情感交流','求助咨询','radio43','radio7','生活日常','顺风拼车','radio40','碎碎碎念','radio42','许个愿吧','radio43','radio7','学习交流','radio2','radio3','寻物招领','radio1','rent','owner','租房']
    return radioList
  }
  var radioList = []
  for (var i=0;i<cateList.length;i++) { 
    if (cateList[i]=="闲置") {
      radioList = radioList.concat(['radio10', 'radio11', 'radio12', 'radio13', 'radio14', 'radio15', 'radio16', 'radio17', 'radio18','radio20', 'radio19','radio21','闲置'])
    } else if (cateList[i]=="求职") {
      radioList = radioList.concat(['短期兼职','求职','radio5'])
    } else if (cateList[i]=="求助") {
      radioList = radioList.concat(['求助','radio43','radio7'])
    } else if (cateList[i]=="租房") {
      radioList = radioList.concat(['radio1','rent','owner','租房'])
    } else if (cateList[i]=="树洞") {
      radioList = radioList.concat(['radio40','radio41','radio42','radio43','树洞'])
    }
  }
  return radioList
};

module.exports = {
  cateToRadio: cateToRadio
}



