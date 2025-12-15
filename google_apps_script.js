/**
 * Google Apps Script - 众测数据收集
 * 
 * 使用方法:
 * 1. 打开 Google Sheets，点击 扩展程序 → Apps Script
 * 2. 复制粘贴此代码
 * 3. 点击 部署 → 新建部署 → 网页应用
 * 4. 设置: 执行身份=我, 谁可以访问=任何人
 * 5. 复制生成的 URL 到 index.html 的 GOOGLE_SCRIPT_URL
 */

function doPost(e) {
  try {
    // 获取或创建工作表
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('原始数据');
    
    if (!sheet) {
      sheet = ss.insertSheet('原始数据');
      // 添加表头
      sheet.getRange(1, 1, 1, 8).setValues([[
        '时间戳', '用户ID', '商品ID', '选择A_新模特', '选择B_新模特+背景', '选择C_老模特', '选择都不满意', '原始选择'
      ]]);
      // 冻结首行
      sheet.setFrozenRows(1);
      // 设置列宽
      sheet.setColumnWidth(1, 180);
      sheet.setColumnWidth(2, 150);
      sheet.setColumnWidth(3, 120);
      sheet.setColumnWidth(8, 200);
    }
    
    // 解析数据
    var data = JSON.parse(e.postData.contents);
    var username = data.username || '匿名';
    var timestamp = new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'});
    
    // 处理每条记录
    var rows = [];
    data.results.forEach(function(result) {
      var selected = result.selected || [];
      rows.push([
        timestamp,
        username,
        result.product,
        selected.includes('A_新模特') ? 1 : 0,
        selected.includes('B_新模特+背景') ? 1 : 0,
        selected.includes('C_老模特') ? 1 : 0,
        selected.includes('none') ? 1 : 0,
        selected.join(', ')
      ]);
    });
    
    // 批量写入数据
    if (rows.length > 0) {
      var lastRow = sheet.getLastRow();
      sheet.getRange(lastRow + 1, 1, rows.length, 8).setValues(rows);
    }
    
    // 更新统计表
    updateStats(ss);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '数据已保存',
      count: rows.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error('Error:', error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: '众测数据收集服务正在运行',
    time: new Date().toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai'})
  })).setMimeType(ContentService.MimeType.JSON);
}

// 更新统计表
function updateStats(ss) {
  var statsSheet = ss.getSheetByName('统计汇总');
  
  if (!statsSheet) {
    statsSheet = ss.insertSheet('统计汇总');
    
    // 设置统计表格式
    statsSheet.getRange('A1').setValue('📊 众测统计汇总').setFontSize(16).setFontWeight('bold');
    statsSheet.getRange('A3').setValue('总体统计').setFontWeight('bold');
    statsSheet.getRange('A4').setValue('总投票数');
    statsSheet.getRange('A5').setValue('参与用户数');
    
    statsSheet.getRange('A7').setValue('版本得票统计').setFontWeight('bold');
    statsSheet.getRange('A8').setValue('版本');
    statsSheet.getRange('B8').setValue('得票数');
    statsSheet.getRange('C8').setValue('占比');
    
    statsSheet.getRange('A9').setValue('A_新模特');
    statsSheet.getRange('A10').setValue('B_新模特+背景');
    statsSheet.getRange('A11').setValue('C_老模特');
    statsSheet.getRange('A12').setValue('都不满意');
    
    // 添加公式
    statsSheet.getRange('B4').setFormula('=COUNTA(原始数据!A:A)-1');
    statsSheet.getRange('B5').setFormula('=IFERROR(COUNTUNIQUE(原始数据!B2:B),0)');
    
    statsSheet.getRange('B9').setFormula('=SUM(原始数据!D:D)');
    statsSheet.getRange('B10').setFormula('=SUM(原始数据!E:E)');
    statsSheet.getRange('B11').setFormula('=SUM(原始数据!F:F)');
    statsSheet.getRange('B12').setFormula('=SUM(原始数据!G:G)');
    
    statsSheet.getRange('C9').setFormula('=IFERROR(B9/SUM($B$9:$B$12),0)');
    statsSheet.getRange('C10').setFormula('=IFERROR(B10/SUM($B$9:$B$12),0)');
    statsSheet.getRange('C11').setFormula('=IFERROR(B11/SUM($B$9:$B$12),0)');
    statsSheet.getRange('C12').setFormula('=IFERROR(B12/SUM($B$9:$B$12),0)');
    
    // 设置百分比格式
    statsSheet.getRange('C9:C12').setNumberFormat('0.0%');
    
    // 设置列宽
    statsSheet.setColumnWidth(1, 150);
    statsSheet.setColumnWidth(2, 100);
    statsSheet.setColumnWidth(3, 100);
  }
}

// 手动运行此函数初始化表格
function initSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 创建原始数据表
  var dataSheet = ss.getSheetByName('原始数据');
  if (!dataSheet) {
    dataSheet = ss.insertSheet('原始数据');
    dataSheet.getRange(1, 1, 1, 8).setValues([[
      '时间戳', '用户ID', '商品ID', '选择A_新模特', '选择B_新模特+背景', '选择C_老模特', '选择都不满意', '原始选择'
    ]]);
    dataSheet.setFrozenRows(1);
  }
  
  // 创建统计表
  updateStats(ss);
  
  Logger.log('表格初始化完成');
}

