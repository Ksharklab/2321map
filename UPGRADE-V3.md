# V3 覆盖上传检查表

上传完成后，仓库根目录至少应看到：

- `index.html`
- `edit.html`
- `admin.html`
- `sw.js`
- `manifest.webmanifest`
- `.nojekyll`
- `assets/`

`assets/` 中至少应看到：

- `china-outline.js`
- `regions.js`
- `map-engine.js`
- `map.js`
- `edit.js`
- `admin.js`
- `common.js`
- `config.js`
- `style.css`

部署成功后先按 `Ctrl + F5`。如果浏览器仍显示旧版，可在开发者工具 → Application → Service Workers 中注销旧 Service Worker，再刷新。
