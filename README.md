# 模特棚拍效果众测

AI生成的电商商品模特展示图盲测评估平台。

## 部署到 Vercel

### 方法一：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 在此目录下运行
cd crowdtest-deploy
vercel

# 生产部署
vercel --prod
```

### 方法二：通过 GitHub + Vercel

1. 将此文件夹推送到 GitHub 仓库
2. 在 Vercel 控制台导入该仓库
3. 选择 "Other" 框架，直接部署静态文件

## 文件说明

- `index.html` - 众测页面（主页）
- `results.html` - 结果统计页面
- `products.json` - 商品数据配置
- `效果批测/` - 所有商品图片资源
- `vercel.json` - Vercel 配置文件

## 使用说明

### 用户评测流程

1. 访问首页，输入昵称（可选）
2. 点击"开始评测"
3. 每题展示一个商品和3张生成图（随机排序）
4. 选择喜欢的图片（可多选）或选择"都不满意"
5. 完成后可下载/复制评测结果

### 管理员查看结果

1. 访问 `/results.html`
2. 导入用户提交的 JSON 文件
3. 查看各版本的得票统计

## 版本说明

| 实际版本 | 文件名 | 说明 |
|----------|--------|------|
| A_新模特 | new_model_output.jpg | 仅使用新模特 |
| B_新模特+背景 | new_model_background_output.jpg | 新模特+匹配背景 |
| C_老模特 | old_model_output.jpg | 使用老模特 |

用户在评测时只能看到"图片A/B/C"，不知道具体对应哪个版本。

