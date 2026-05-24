# Workout HUB

一个独立静态项目，用来整合动作笔记、训练计划和历史训练记录。

## 维护位置

- `content/exercise-notes.md`：动作库源文件。项目大类对应 Markdown 的 `#`，具体动作对应 `##`，`###` 及以下标题只作为具体动作详情内容展示。
- `content/current-plan.md`：当前训练计划源文件。
- `data/training-log.csv`：训练记录源文件。
- `media/`：动作图片、GIF 和视频。

`data/*.js` 是网页读取的数据文件，由 `tools/rebuild.mjs` 生成。

## 使用

直接打开 `index.html` 即可。

## 更新

修改上面的源文件后，本地运行：

```powershell
npm run rebuild
```

这会重新生成动作库、训练计划和训练记录页面需要的数据。

如果要生成和 GitHub Pages 一样的发布目录，运行：

```powershell
npm run build
```

生成结果会放在 `dist/`，这个目录不用提交。

## GitHub Pages 自动发布

这个项目已配置 GitHub Actions。推送到 `main` 或 `master` 后，GitHub 会自动：

1. 读取 `content/exercise-notes.md`
2. 读取 `content/current-plan.md`
3. 读取 `data/training-log.csv`
4. 生成网页需要的数据文件
5. 发布 `dist/` 到 GitHub Pages

第一次使用时，在 GitHub 仓库的 `Settings` -> `Pages` 里，把 `Build and deployment` 的 `Source` 设为 `GitHub Actions`。
