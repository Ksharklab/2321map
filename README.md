# 2321班全国蹭饭地图 V3

V3 是可直接部署到 GitHub Pages 的完整版本，已填写现有 Supabase 项目地址。

## V3 的主要变化

- 不使用高德地图、地图 Key 或地图实名认证。
- 不在运行时请求 GeoJSON 地图接口，也不依赖 ECharts CDN。
- 中国地图轮廓、城市坐标和渲染代码都放在仓库本地。
- 支持地图拖动、缩放、搜索、省份筛选、同学资料卡和移动端布局。
- 公开资料读取失败时，可显示浏览器中上一次缓存的数据。
- 保留原有 Supabase 数据表和三个 Edge Function，现有后台可以继续使用。

## 从 V2 升级

1. 下载并解压本项目。
2. 在 GitHub 仓库根目录上传本项目的全部文件，选择覆盖同名文件。
3. 确认 `assets` 文件夹中包含 `map-engine.js`、`regions.js` 和 `china-outline.js`。
4. 等待 Actions 中 Pages 部署变为绿色。
5. 打开网站后按 `Ctrl + F5` 强制刷新一次。

不需要重建 Supabase 项目，也不需要重新运行 SQL。已有三个 Edge Function 可继续使用。

## 新部署

GitHub：Settings → Pages → Deploy from a branch → `main` → `/(root)`。

Supabase 全新项目的初始化文件位于 `supabase/`。需要设置 Edge Function Secret：

- `ADMIN_PASSWORD`

`SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 由 Supabase Edge Function 环境提供，不要放进网页代码。

## 数据与隐私

- 前端仅公开经过审核且同意公开的资料。
- 地图只显示城市中心点，不应收集家庭地址或精确位置。
- `assets/config.js` 中只包含公开的 Supabase 项目 URL，不包含管理员密码或 Service Role Key。

## 第三方数据说明

- 地图轮廓由本地安装的 `countryinfo` 数据整理，用于低精度可视化。
- 城市中心坐标以开源中国城市坐标数据为基础，并对当前地级行政区名称做了整理。
- 本地图仅用于班级信息展示，不用于导航、测绘或行政边界认定。
