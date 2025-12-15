/**
 * Google Apps Script - 众测数据收集
 * 
 * ⚠️ 更新步骤 (每次修改后必须执行):
 * 1. 复制此代码替换 Apps Script 中的代码
 * 2. 点击 "部署" → "管理部署"
 * 3. 点击 "编辑" (铅笔图标)
 * 4. 版本选择 "新版本"
 * 5. 点击 "部署"
 * 
 * 如果是首次部署:
 * 1. 点击 "部署" → "新建部署"
 * 2. 类型选择 "网页应用"
 * 3. 执行身份: "我"
 * 4. 访问权限: "任何人"
 * 5. 部署
 */

// GET 请求处理 (支持 Image beacon 方式)
function doGet(e) {
  try {
    // 检查是否是数据提交请求
    if (e.parameter && e.parameter.action === 'log' && e.parameter.data) {
      var data = JSON.parse(decodeURIComponent(e.parameter.data));
      saveData(data);
      
      // 返回 1x1 透明 GIF
      return ContentService.createTextOutput('')
        .setMimeType(ContentService.MimeType.TEXT);
    }
    
    // 状态检查请求
    return ContentService.createTextOutput(JSON.stringify({
      status: 'ok',
      message: '众测数据收集服务正在运行',
      time: new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('doGet Error: ' + error.toString());
    return ContentService.createTextOutput('error');
  }
}

// POST 请求处理
function doPost(e) {
  try {
    var data;
    
    // 支持 form data 和 JSON 两种格式
    if (e.parameter && e.parameter.data) {
      data = JSON.parse(e.parameter.data);
    } else if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else {
      throw new Error('No data received');
    }
    
    saveData(data);
    
    return HtmlService.createHtmlOutput('<html><body><script>window.close();</script>OK</body></html>');
    
  } catch (error) {
    Logger.log('doPost Error: ' + error.toString());
    return HtmlService.createHtmlOutput('Error: ' + error.toString());
  }
}

// 保存数据到表格
function saveData(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('原始数据');
  
  if (!sheet) {
    sheet = ss.insertSheet('原始数据');
    sheet.getRange(1, 1, 1, 8).setValues([[
      '时间戳', '用户ID', '商品ID', '选择A_新模特', '选择B_新模特+背景', '选择C_老模特', '选择都不满意', '原始选择'
    ]]);
    sheet.setFrozenRows(1);
    sheet.getRange('1:1').setFontWeight('bold').setBackground('#4a5568').setFontColor('white');
  }
  
  var username = data.username || '匿名';
  var timestamp = new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'});
  
  // 处理每条记录
  var rows = [];
  if (data.results && data.results.length > 0) {
    data.results.forEach(function(result) {
      var selected = result.selected || [];
      rows.push([
        timestamp,
        username,
        result.product || 'unknown',
        selected.includes('A_新模特') ? 1 : 0,
        selected.includes('B_新模特+背景') ? 1 : 0,
        selected.includes('C_老模特') ? 1 : 0,
        selected.includes('none') ? 1 : 0,
        selected.join(', ')
      ]);
    });
  }
  
  // 批量写入
  if (rows.length > 0) {
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, rows.length, 8).setValues(rows);
    Logger.log('写入 ' + rows.length + ' 条数据');
  }
  
  // 更新统计
  updateStats(ss);
}

// 更新统计表
function updateStats(ss) {
  var statsSheet = ss.getSheetByName('统计汇总');
  
  if (!statsSheet) {
    statsSheet = ss.insertSheet('统计汇总');
    
    // 标题
    statsSheet.getRange('A1').setValue('📊 众测统计汇总').setFontSize(16).setFontWeight('bold');
    
    // 总体统计
    statsSheet.getRange('A3').setValue('总体统计').setFontWeight('bold');
    statsSheet.getRange('A4').setValue('总投票数');
    statsSheet.getRange('A5').setValue('参与用户数');
    statsSheet.getRange('A6').setValue('评测商品数');
    
    // 版本统计
    statsSheet.getRange('A8').setValue('版本得票统计').setFontWeight('bold');
    statsSheet.getRange('A9').setValue('版本');
    statsSheet.getRange('B9').setValue('得票数');
    statsSheet.getRange('C9').setValue('占比');
    statsSheet.getRange('A9:C9').setFontWeight('bold').setBackground('#e2e8f0');
    
    statsSheet.getRange('A10').setValue('A_新模特');
    statsSheet.getRange('A11').setValue('B_新模特+背景');
    statsSheet.getRange('A12').setValue('C_老模特');
    statsSheet.getRange('A13').setValue('都不满意');
    
    // 公式
    statsSheet.getRange('B4').setFormula('=COUNTA(原始数据!A:A)-1');
    statsSheet.getRange('B5').setFormula('=IFERROR(COUNTUNIQUE(原始数据!B2:B),0)');
    statsSheet.getRange('B6').setFormula('=IFERROR(COUNTUNIQUE(原始数据!C2:C),0)');
    
    statsSheet.getRange('B10').setFormula('=SUM(原始数据!D:D)');
    statsSheet.getRange('B11').setFormula('=SUM(原始数据!E:E)');
    statsSheet.getRange('B12').setFormula('=SUM(原始数据!F:F)');
    statsSheet.getRange('B13').setFormula('=SUM(原始数据!G:G)');
    
    statsSheet.getRange('C10').setFormula('=IFERROR(B10/SUM($B$10:$B$13),0)');
    statsSheet.getRange('C11').setFormula('=IFERROR(B11/SUM($B$10:$B$13),0)');
    statsSheet.getRange('C12').setFormula('=IFERROR(B12/SUM($B$10:$B$13),0)');
    statsSheet.getRange('C13').setFormula('=IFERROR(B13/SUM($B$10:$B$13),0)');
    
    statsSheet.getRange('C10:C13').setNumberFormat('0.0%');
    
    // 列宽
    statsSheet.setColumnWidth(1, 150);
    statsSheet.setColumnWidth(2, 100);
    statsSheet.setColumnWidth(3, 100);
  }
}

// 初始化表格 (手动运行一次)
function initSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var dataSheet = ss.getSheetByName('原始数据');
  if (!dataSheet) {
    dataSheet = ss.insertSheet('原始数据');
    dataSheet.getRange(1, 1, 1, 8).setValues([[
      '时间戳', '用户ID', '商品ID', '选择A_新模特', '选择B_新模特+背景', '选择C_老模特', '选择都不满意', '原始选择'
    ]]);
    dataSheet.setFrozenRows(1);
    dataSheet.getRange('1:1').setFontWeight('bold').setBackground('#4a5568').setFontColor('white');
  }
  
  updateStats(ss);
  Logger.log('✅ 表格初始化完成');
}

// 清空数据 (慎用)
function clearData() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('原始数据');
  if (sheet && sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
    Logger.log('✅ 数据已清空');
  }
}

// 测试函数
function testSaveData() {
  var testData = {
    username: '测试用户_' + Date.now(),
    results: [
      { product: 'test_product_1', selected: ['A_新模特'] },
      { product: 'test_product_2', selected: ['B_新模特+背景', 'C_老模特'] },
      { product: 'test_product_3', selected: ['none'] }
    ]
  };
  
  saveData(testData);
  Logger.log('✅ 测试数据已写入，请检查表格');
}
