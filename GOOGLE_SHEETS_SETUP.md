# Google Sheets 自动统计设置指南

## 步骤 1：创建 Google Sheets

1. 打开 [Google Sheets](https://sheets.google.com)
2. 创建新表格，命名为 "众测结果统计"
3. 创建两个工作表：
   - `原始数据` - 存储每条投票记录
   - `统计汇总` - 自动统计

### 原始数据 表头（第一行）：
| A | B | C | D | E | F | G | H |
|---|---|---|---|---|---|---|---|
| 时间戳 | 用户ID | 商品ID | 选择A_新模特 | 选择B_新模特+背景 | 选择C_老模特 | 选择都不满意 | 原始选择 |

## 步骤 2：创建 Google Apps Script

1. 在 Google Sheets 中，点击 **扩展程序** → **Apps Script**
2. 删除默认代码，粘贴以下代码：

```javascript
// Google Apps Script 代码
// 粘贴到 Apps Script 编辑器中

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('原始数据');
    if (!sheet) {
      sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet('原始数据');
      // 添加表头
      sheet.getRange(1, 1, 1, 8).setValues([[
        '时间戳', '用户ID', '商品ID', '选择A_新模特', '选择B_新模特+背景', '选择C_老模特', '选择都不满意', '原始选择'
      ]]);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    // 处理每条记录
    data.results.forEach(function(result) {
      var selected = result.selected;
      var row = [
        new Date().toISOString(),
        data.username,
        result.product,
        selected.includes('A_新模特') ? 1 : 0,
        selected.includes('B_新模特+背景') ? 1 : 0,
        selected.includes('C_老模特') ? 1 : 0,
        selected.includes('none') ? 1 : 0,
        selected.join(', ')
      ];
      sheet.appendRow(row);
    });
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: '数据已保存',
      count: data.results.length
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: '众测数据收集服务正在运行'
  })).setMimeType(ContentService.MimeType.JSON);
}
```

3. 点击 **部署** → **新建部署**
4. 选择类型：**网页应用**
5. 设置：
   - 执行身份：**我**
   - 谁可以访问：**任何人**
6. 点击 **部署**
7. **复制生成的网页应用 URL**（类似 `https://script.google.com/macros/s/xxx/exec`）

## 步骤 3：更新众测网页

将复制的 URL 填入 `index.html` 中的 `GOOGLE_SCRIPT_URL` 变量。

## 步骤 4：创建统计汇总公式

在 `统计汇总` 工作表中添加以下公式：

### A1: 总投票数
```
=COUNTA(原始数据!A:A)-1
```

### B1: 总用户数
```
=COUNTUNIQUE(原始数据!B:B)-1
```

### 各版本得票统计
| 版本 | 得票数 | 百分比 |
|------|--------|--------|
| A_新模特 | `=SUM(原始数据!D:D)` | `=D2/SUM(D2:D5)` |
| B_新模特+背景 | `=SUM(原始数据!E:E)` | `=D3/SUM(D2:D5)` |
| C_老模特 | `=SUM(原始数据!F:F)` | `=D4/SUM(D2:D5)` |
| 都不满意 | `=SUM(原始数据!G:G)` | `=D5/SUM(D2:D5)` |

