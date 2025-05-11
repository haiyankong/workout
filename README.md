# 参考

## Original repo

- [yihong0618](https://github.com/yihong0618)/[running_page](https://github.com/yihong0618/running_page)

- [ben-29](https://github.com/ben-29)/[workouts_page](https://github.com/ben-29/workouts_page)

## 抄作业

- https://github.com/ben-29/workouts_page/issues/20
- [也搞了一个展示行走数据的页面 | 椒盐豆豉](https://blog.douchi.space/steps-page/)


# 基本设置

## 1 下载仓库

下载 [ben-29](https://github.com/ben-29)/[workouts_page](https://github.com/ben-29/workouts_page) 到 D:\para\a\workout，Ubuntu 运行：

```
cd /mnt/d/para/a/workout
```

## 2 安装 Python 库和配置 Node.js 依赖管理

在前面打开的 Ubuntu 内继续运行：

```
pip3 install -r requirements.txt
```
```
npm install -g corepack && corepack enable && pnpm install
```

## 3 同步数据

### 3.1 Keep

```
python3 run_page/keep_sync.py ${your mobile} ${your password}
```

### 3.2 Strava

#### 3.2.1 登录 Strava，获取API，得到 client_id 和 client_secret：

https://www.strava.com/settings/api

#### 3.2.2 在浏览器中输入以下链接，得到 code：

```
https://www.strava.com/oauth/authorize?client_id=137212&response_type=code&redirect_uri=http://localhost/exchange_token&approval_prompt=force&scope=read_all,profile:read_all,activity:read_all,profile:write,activity:write
```

#### 3.2.3 Ubuntu 运行以下内容，得到 refresh_token：

```
curl -X POST https://www.strava.com/oauth/token \
-F client_id= \
-F client_secret= \
-F code= \
-F grant_type=authorization_code
```

####  3.2.4 最终运行：

```
python3 run_page/strava_sync.py ${client_id} ${client_secret} ${refresh_token}
```

如果数据很多，需要等一会。

## 4 数据 SVG

### GitHub Calendar

```
python3 run_page/gen_svg.py --from-db --title 'Calendar' --type github --athlete 'HY Kong' --output assets/github.svg --use-localtime --min-distance 0.1
```

### Gird

```
python3 run_page/gen_svg.py --from-db --title 'Data Over 5km' --type grid --athlete 'HY Kong'  --output assets/grid.svg --min-distance 4.9 --use-localtime
```

### 年度环形数据

```
python3 run_page/gen_svg.py --from-db --type circular --use-localtime
```

### 如果一生只有 1000 个月的 Runner Month of Life

```
python3 run_page/gen_svg.py --from-db --type monthoflife --birth 1998-01 --output assets/mol.svg --use-localtime --athlete 'HY Kong' --title 'Runner Month of Life'
```

## 5 部署

```
pnpm develop
```

# 进一步修改

## 必须修改的内容
- .github\workflows\gh-pages.yml：确认是否需要修改分支名（直接 fork 或者下载的仓库里面默认是`master`，注意是否需要修改为`main`）
- .github\workflows\run_data_sync.yml，注意不要删除任何行
    - schedule cron 代表自动同步数据的时间，改成 '0 0 * * 1' # UTC, minute (0 - 59), hour (0 - 23), day of the month (1 - 31), month (1 - 12), day of the week (0 - 6, 0 is Sunday)
    - RUN_TYPE: strava
    - ATHLETE: HY Kong
    - TITLE: 'Calendar'
    - MIN_GRID_DISTANCE: 4.9 # min distance
    - TITLE_GRID: 'Data Over 5km'
- .gitignore 也要确认是否需要修改

## 样式修改（非必须）

### 配色样式
- 整个页面的底色：src\components\Layout\style.module.css 的 background-color
- 轨迹颜色，直接将所有类型的轨迹颜色设置为了一种颜色 nike，另外，左侧栏运动数据汇总的颜色也是 nike：src\utils\const.ts
- 地图 light/dark 模式：src\components\RunMap\index.tsx，`mapStyle="mapbox://styles/mapbox/dark-v10"` 或者 `mapStyle="mapbox://styles/mapbox/light-v10"`
- 地图中，左上角年份的颜色 button，选中地图中左上角某一年份后的颜色 selected、选中左上角某一年份或者表格内某一行数据后地图左下角的文字颜色 runTitle：src\components\RunMap\style.module.css
- 表格中，表头的颜色 runTable，选中表格内某一行数据后该行数据的颜色 selected，日期时间的颜色 runDate：src\components\RunTable\style.module.css
- 左侧栏的 XXXX year 的颜色，左上角文字的颜色，右上角导航栏文字的颜色：src\components\Layout\style.module.css 的 color
- 左侧栏各年份之间 hr 的颜色，左侧栏的尺寸样式以及文字内容、左侧栏的 svg 的尺寸样式：src\components\YearStat\index.tsx
- 左上角标题栏和下方左侧栏内容之间 hr 的颜色：src\components\YearsStat\index.tsx
- 环状图的颜色：run_page\gpxtrackposter\poster.py
- GitHub heatmap 小方块底的颜色：run_page\gpxtrackposter\github_drawer.py
- GitHub，Grid，Mol 底以及轨迹、有轨迹数据的小方块的颜色：run_page\gen_svg.py
- 也把这几个文件里面的颜色一块改上，但是还不太清楚这些地方修改的是什么：
	- src\components\LocationStat\LocationSummary.tsx
	- src\components\LocationStat\PeriodStat.tsx
	- src\components\LocationStat\index.tsx

### 内容样式
- 页面图标：public\images\favicon.png
- 默认的导航栏名称：index.html
- 页面右上角导航栏内容、左上角图标：src\static\site-metadata.ts
- 左上角副标题中英文内容、各项运动中英文名称、MAPBOX_TOKEN：src\utils\const.ts
- 表格列内容：src\components\RunTable\index.tsx
- 取消年度环状图的 hover 样式：src\components\YearStat\index.tsx，删除 `{year !== 'Total' && hovered && (` 里面的 `hovered ` ，即修改为`{year !== 'Total' && (`
- total 页面下，GitHub 和 Grid 位置排布：src\components\SVGStat\index.tsx

### 其他
- 时区：全局搜索 `Asia/Shanghai` `TIMEZONE_OFFSET` 替换成本地时区值
- 中英文模式：src\utils\const.ts，注意修改 IS_CHINESE = false / true
- 添加新的运动类型：
    - src\utils\const.ts，例如添加 workout，加：`const WORKOUT_TITLE = IS_CHINESE ? '无氧训练' : 'Workout';`，const RUN_TITLES 内添加 `WORKOUT_TITLE`，`export const WORKOUT_COLOR = nike; `
    - run_page\config.py，例如添加 workout，加：`"Workout": "Workout",`

# 仓库设置

## Settings---Secrets and variables---Action---Repository secrets

KEEP_MOBILE

KEEP_PASSWORD

STRAVA_CLIENT_ID

STRAVA_CLIENT_SECRET

STRAVA_CLIENT_REFRESH_TOKEN

## Settings---Actions---General---Workflow permissions

select Read and write permissions

## Settings---Pages---Build and deployment----Source

select GitHub Actions

## Action

Run Data Sync---Run workflow

# 更新数据

新数据

- 手动更新的方式：Action---Run Data Sync---Run workflow

- 但是仓库已经设置每周自动更新，不需要再手动更新。

旧数据

- 先删除 `...\src\static\activities.json` 和 `...\run_page\data.db`

- 然后 Action---Run Data Sync---Run workflow

# Fork Repo

## 必须修改的内容

- `.github\workflows\gh-pages.yml`，确认是否需要修改分支名，# if your default branches is not master, please change it here
- `...\.github\workflows\run_data_sync.yml`
    - RUN_TYPE: 运动软件，根据实际修改
    - ATHLETE: 最终显示在 grid 的名字
- 删除 `src\static\activities.json` 和 `run_page\data.db` 
- 删除 assets 文件夹内除了`index.tsx，end.svg，start.svg`以外的内容

## 仓库设置（同上）