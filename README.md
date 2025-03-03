Forked from [yihong0618](https://github.com/yihong0618)/[running_page](https://github.com/yihong0618/running_page) and [ben-29](https://github.com/ben-29)/[workouts_page](https://github.com/ben-29/workouts_page).

# 同步数据

## 1 创建仓库

Fork [ben-29](https://github.com/ben-29)/[workouts_page](https://github.com/ben-29/workouts_page) 到本地，本地路径为`D:\para\a\website\workout`，Ubuntu 运行

```
cd /mnt/d/para/a/website/workout
```

## 2 安装 Python 库和配置 Node.js 依赖管理

在前面打开的 Ubuntu 内继续运行

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

#### 3.2.1 登录 Strava，获取API，得到 client_id 和 client_secret

https://www.strava.com/settings/api

#### 3.2.2 在浏览器中输入以下链接，得到 code
```
https://www.strava.com/oauth/authorize?client_id=client_id&response_type=code&redirect_uri=http://localhost/exchange_token&approval_prompt=force&scope=read_all,profile:read_all,activity:read_all,profile:write,activity:write
```

#### 3.2.3 Ubuntu 运行以下内容，得到 refresh_token
```
curl -X POST https://www.strava.com/oauth/token \
-F client_id=client_id \
-F client_secret=client_secret \
-F code=code \
-F grant_type=authorization_code
```

####  3.2.4 最终运行

```
python3(python) run_page/strava_sync.py ${client_id} ${client_secret} ${refresh_token}
```

## 4 生成 SVG

在运行下面的三行代码之前，把 assets 文件夹内除了`index.tsx，end.svg，start.svg`以外的内容删除。

```
python3 run_page/gen_svg.py --from-db --title "Calendar" --type github --athlete "name" --output assets/github.svg --use-localtime --min-distance 0.5
```

```
python3 run_page/gen_svg.py --from-db --title "Data Over 5km" --type grid --athlete "name"  --output assets/grid.svg --min-distance 5 --use-localtime
```

```
python3 run_page/gen_svg.py --from-db --type circular --use-localtime
```

## 5 部署

```
pnpm develop
```

# 进一步修改

`...\.github\workflows\gh-pages.yml`

- 确认是否需要修改分支名，# if your default branches is not master, please change it here

`...\.github\workflows\run_data_sync.yml`，修改，但是不要删除任何行

`...\public\images\favicon.png`，修改页面图标

页面样式在`...\src`文件夹修改

`.gitignore`的内容也要注意修改

# 仓库准备

## Settings---Secrets and variables---Action---Repository secrets

KEEP_MOBILE

KEEP_PASSWORD

STRAVA_CLIENT_ID

STRAVA_CLIENT_SECRET

STRAVA_CLIENT_REFRESH_TOKEN

## Settings---Actions---General---Workflow permissions

select Read and write permissions

## Settings---Pages

select GitHub Actions

## Action

Run Data Sync---Run workflow

# 更新数据

更新数据

- 仓库每天自动更新，不需要手动更新（手动更新的方式：Action---Run Data Sync --- Run workflow）

更新旧数据

- 删除 `...\src\static\activities.json` 和 `...\run_page\data.db`

- 然后 Action---Run Data Sync --- Run workflow