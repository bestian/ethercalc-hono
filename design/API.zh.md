# EtherCalc API 與資料庫操作文件

---

## 一、REST API 端點

### 1.1 房間管理

| 方法 | 路徑 | 說明 | 請求格式 | 回應 |
|------|------|------|----------|------|
| GET | `/_new` | 建立新試算表（產生隨機 UUID 後跳轉） | - | 302 重導向 |
| GET | `/_from/{template}` | 從模板複製建立新試算表 | - | 302 重導向 |
| GET | `/_exists/{room}` | 檢查房間是否存在 | - | `true` / `false` (JSON) |
| GET | `/_rooms` | 列出所有房間（CORS 啟用時返回 403） | - | JSON 陣列 |
| GET | `/_roomlinks` | 列出所有房間的 HTML 連結（CORS 啟用時返回 403） | - | HTML |
| GET | `/_roomtimes` | 列出所有房間的最後修改時間（CORS 啟用時返回 403） | - | JSON（依時間排序） |

### 1.2 試算表 CRUD

| 方法 | 路徑 | 說明 | 請求格式 |
|------|------|------|----------|
| POST | `/_` | 建立新頁面 | `application/json`（`{room, snapshot}`）、`text/csv`、`text/x-socialcalc`、Excel XML |
| GET | `/_/{room}` | 取得工作表 SocialCalc 原始格式 | - |
| PUT | `/_/{room}` | 覆寫工作表 | `text/csv`、`text/x-socialcalc`、Excel XML、`text/x-ethercalc-csv-double-encoded` |
| POST | `/_/{room}` | 執行指令（SocialCalc command） | `application/json`（`{command}`）、`text/plain`、`text/csv`（追加列） |
| DELETE | `/_/{room}` | 刪除房間 | - |

### 1.3 儲存格操作

| 方法 | 路徑 | 說明 | 回應格式 |
|------|------|------|----------|
| GET | `/_/{room}/cells` | 取得所有儲存格 JSON | `application/json` |
| GET | `/_/{room}/cells/{coord}` | 取得單一儲存格 JSON | `application/json` |

### 1.4 匯出端點

每種格式都有兩種 URL 風格可使用：

| 格式 | URL 風格 1 | URL 風格 2 | Content-Type |
|------|-----------|-----------|-------------|
| CSV | `/{room}.csv` | `/_/{room}/csv` | `text/csv` |
| CSV JSON | `/{room}.csv.json` | `/_/{room}/csv.json` | `application/json` |
| HTML | `/{room}.html` | `/_/{room}/html` | `text/html` |
| Excel XLSX | `/{room}.xlsx` | `/_/{room}/xlsx` | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` |
| ODS | `/{room}.ods` | `/_/{room}/ods` | `application/vnd.oasis.opendocument.spreadsheet` |
| FODS | `/{room}.fods` | `/_/{room}/fods` | `application/vnd.oasis.opendocument.spreadsheet` |
| Markdown | `/{room}.md` | `/_/{room}/md` | `text/x-markdown` |

### 1.5 多工作表匯入/匯出

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/={room}.xlsx` | 匯出多工作表為 Excel |
| GET | `/={room}.ods` | 匯出多工作表為 ODS |
| GET | `/={room}.fods` | 匯出多工作表為 FODS |
| PUT | `/={room}.xlsx` | 匯入 Excel 多工作表 |
| PUT | `/={room}.ods` | 匯入 ODS 多工作表 |
| PUT | `/={room}.fods` | 匯入 FODS 多工作表 |

### 1.6 定時觸發

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/_timetrigger` | 觸發到期的定時任務（由 cron 呼叫），發送到期 email 並更新下次觸發時間 |

### 1.7 頁面檢視路由

| 路徑 | 說明 |
|------|------|
| `/{room}` | 進入試算表（自動判斷單/多工作表） |
| `/{room}/edit` | 編輯模式（透過 HMAC 驗證） |
| `/{room}/view` | 唯讀模式 |
| `/{room}/app` | App 模式 |
| `/{template}/form` | 表單模式（從模板複製後進入 App 模式） |
| `/{template}/appeditor` | App 編輯器面板 |

---

## 二、WebSocket 事件（Socket.IO）

### 2.1 客戶端 → 伺服器

| 事件 type | 資料欄位 | 說明 |
|-----------|----------|------|
| `ask.log` | `{room, user}` | 加入房間，請求工作表 snapshot + log + chat 歷史 |
| `ask.recalc` | `{room, user}` | 請求重新計算（銷毀再重建工作表引擎） |
| `ask.ecells` | `{room}` | 請求所有使用者目前選取的儲存格位置 |
| `execute` | `{room, user, cmdstr, auth}` | 執行 SocialCalc 指令（需驗證 auth） |
| `my.ecell` | `{room, user, ecell}` | 回報自己目前選取的儲存格 |
| `ecell` | `{room, user, ecell, original}` | 廣播自己的游標移動 |
| `chat` | `{room, user, msg}` | 傳送聊天訊息 |
| `stopHuddle` | `{room, auth}` | 結束協作會議（刪除房間所有資料） |

### 2.2 伺服器 → 客戶端

| 事件 type | 資料欄位 | 說明 |
|-----------|----------|------|
| `log` | `{room, log, chat, snapshot}` | 回應 `ask.log`，包含完整工作表資料 |
| `recalc` | `{room, snapshot, force?}` | 回應 `ask.recalc` 或快照更新 |
| `ecells` | `{ecells, room}` | 回應 `ask.ecells`，所有使用者的游標位置 |
| `execute` | `{cmdstr, room}` | 廣播指令給其他使用者 |
| `snapshot` | `{snapshot, room}` | 廣播新的工作表快照 |
| `chat` | `{msg, room, user}` | 廣播聊天訊息 |
| `stopHuddle` | `{room}` | 通知所有使用者協作結束 |
| `confirmemailsent` | `{message}` | 通知 email 發送結果 |
| `error` | `{message}` | 錯誤訊息 |
| `ignore` | - | 資料庫尚未就緒，忽略連線請求 |

---

## 三、內部資料庫操作（Redis / 檔案系統）

### 3.1 儲存引擎

- **主要儲存**：Redis 2.4+
- **備援儲存**：磁碟 JSON 檔案（`{dataDir}/dump/` 目錄，單機模式）
- 備援模式下不支援 `--expire` 功能
- 多伺服器部署必須使用 Redis

### 3.2 Redis 連線設定

| 環境變數 | 預設值 | 說明 |
|----------|--------|------|
| `REDIS_HOST` | `localhost` | Redis 主機 |
| `REDIS_PORT` | `6379` | Redis 端口 |
| `REDIS_SOCKPATH` | - | Unix Socket 路徑（優先於 host/port） |
| `REDIS_PASS` | - | Redis 密碼 |
| `REDIS_DB` | - | Redis 資料庫編號 |
| `OPENSHIFT_DATA_DIR` | `process.cwd()` | 備援檔案儲存目錄 |
| `VCAP_SERVICES` | - | Cloud Foundry 服務探索（自動取得 Redis 設定） |

### 3.3 資料鍵值結構（Key Schema）

| Key 模式 | 型別 | 說明 |
|----------|------|------|
| `snapshot-{room}` | String | 工作表的 SocialCalc 完整快照 |
| `log-{room}` | List | 快照後的指令日誌（replay log） |
| `audit-{room}` | List | 完整稽核記錄（不隨 snapshot 清除） |
| `chat-{room}` | List | 聊天訊息歷史 |
| `ecell-{room}` | Hash | 各使用者目前選取的儲存格（field=user, value=coord） |
| `timestamps` | Hash | 各房間最後更新時間戳（field=`timestamp-{room}`, value=Date.now()） |
| `cron-list` | Hash | 定時觸發任務清單（field=`{room}!{cell}`, value=觸發時間列表） |
| `cron-nextTriggerTime` | String | 下次定時觸發的時間（分鐘為單位） |

### 3.4 讀取操作

| 操作 | 使用位置 | 說明 |
|------|----------|------|
| `GET snapshot-{room}` | `SC._get` | 取得工作表快照 |
| `LRANGE log-{room} 0 -1` | `SC._get`、`ask.log` | 取得完整指令日誌 |
| `LRANGE chat-{room} 0 -1` | `ask.log` | 取得聊天歷史 |
| `LRANGE audit-{room} 0 -1` | 快照重建時 | 取得稽核記錄 |
| `HGETALL ecell-{room}` | `ask.ecells` | 取得所有使用者游標位置 |
| `HGETALL timestamps` | `SC._roomtimes` | 取得所有房間時間戳 |
| `HGETALL cron-list` | `_timetrigger` | 取得所有定時觸發 |
| `KEYS snapshot-*` | `SC._rooms` | 列出所有房間 |
| `EXISTS snapshot-{room}` | `SC._exists` | 檢查房間是否存在 |
| `GET cron-nextTriggerTime` | `setcrontrigger` | 取得下次觸發時間 |

### 3.5 寫入操作

| 操作 | 使用位置 | 說明 |
|------|----------|------|
| `SET snapshot-{room}` | `SC._put`、`on-snapshot` | 儲存/更新工作表快照 |
| `RPUSH log-{room}` | `execute`、`POST /_/{room}` | 追加指令到日誌 |
| `RPUSH audit-{room}` | `execute`、`POST /_/{room}` | 追加指令到稽核記錄 |
| `RPUSH chat-{room}` | `chat` 事件 | 追加聊天訊息 |
| `HSET ecell-{room}` | `my.ecell` | 更新使用者游標位置 |
| `HSET timestamps` | `on-snapshot` | 更新房間時間戳 |
| `HSET cron-list` | `setcrontrigger` | 更新定時觸發時間 |
| `SET cron-nextTriggerTime` | `setcrontrigger`、`_timetrigger` | 更新下次觸發時間 |
| `DEL log-{room}` | `on-snapshot`、`PUT /_/{room}` | 快照後清除日誌 |
| `DEL snapshot/log/chat/ecell/audit-{room}` | `SC._del`、`stopHuddle` | 刪除房間所有資料 |
| `HDEL cron-list` | `_timetrigger`、`setcrontrigger` | 移除已過期的定時觸發 |
| `RENAME snapshot-{room}` | `multi-cascade` 指令 | 備份被刪除的子工作表 |
| `EXPIRE snapshot-{room}` | 啟用 `--expire` 時 | 設定過期時間自動刪除 |
| `BGSAVE` | 各寫入操作後 | 背景持久化 |

### 3.6 備援檔案系統儲存

當 Redis 不可用時，資料儲存於 `{dataDir}/dump/` 目錄：

| 檔案 | 說明 |
|------|------|
| `dump/snapshot-{room}.txt` | 工作表快照（純文字） |
| `dump/audit-{room}.txt` | 稽核記錄（每行一筆，`\n` 以 `\\n` 跳脫） |
| `nextTriggerTime.txt` | 下次定時觸發時間（由 cron 腳本讀取） |

實作細節：
- 透過內建 `Commands` 物件模擬 Redis 指令介面
- `bgsave` 時比對 timestamp，只寫入有變更的房間
- 使用 `minimatch` 模擬 `KEYS` 的 glob 匹配

---

## 四、第三方串接

### 4.1 Email 發送（Gmail OAuth2）

| 項目 | 說明 |
|------|------|
| 服務 | Gmail SMTP（透過 nodemailer） |
| 認證方式 | OAuth2（xoauth2 模組） |
| 觸發方式 | 試算表中使用 `sendemail` 指令，或定時觸發（`settimetrigger` + cron） |

#### 環境變數

| 環境變數 | 說明 |
|----------|------|
| `gmail_user` | Gmail 帳號（也作為寄件者） |
| `gmail_clientId` | OAuth2 Client ID |
| `gmail_clientSecret` | OAuth2 Client Secret |
| `gmail_refreshToken` | OAuth2 Refresh Token |

#### 觸發流程

1. **即時發送**：SocialCalc 指令 `sendemail <to> <subject> <body>` → Worker 發出 `sendemailout` 訊息 → `emailer.sendemail()` → 透過 SMTP 發送 → Socket.IO 回傳 `confirmemailsent`
2. **定時發送**：SocialCalc 指令 `settimetrigger <cell> <times>` → 寫入 `cron-list` → cron 呼叫 `/_timetrigger` → `triggerActionCell` 執行公式中的 email 動作

### 4.2 SocialCalc 引擎

| 項目 | 說明 |
|------|------|
| 套件 | `socialcalc` npm 模組（v2.3.0） |
| 角色 | 核心試算表引擎，處理所有儲存格計算、格式、指令解析 |
| 伺服器端 | 在 WebWorker 執行緒（或 `vm.CreateContext` 備援）中執行 |
| 客戶端 | 直接載入於瀏覽器，處理 UI 渲染與使用者操作 |

### 4.3 J（xlsx/ods 格式轉換）

| 項目 | 說明 |
|------|------|
| 套件 | `j` npm 模組（v0.4.5） |
| 角色 | 伺服器端格式轉換：SocialCalc ↔ XLSX/ODS/FODS/Markdown |
| 操作 | `J.read(buffer)` 讀取、`J.utils.to_{format}()` 輸出 |

### 4.4 XLSX（客戶端解析）

| 項目 | 說明 |
|------|------|
| 套件 | `xlsx` (SheetJS)，客戶端使用 `xlsx.core.min.js` |
| 角色 | 首頁拖放匯入時在瀏覽器端解析 Excel/ODS 檔案 |
| Worker | 使用 `static/xlsxworker.js` 在 WebWorker 中處理 |

### 4.5 Redis

| 項目 | 說明 |
|------|------|
| 套件 | `redis` npm 模組（v0.12.x） |
| 角色 | 主要資料持久化、Socket.IO session 同步（多伺服器） |
| RedisStore | Socket.IO 使用 Redis 作為 adapter 實現多伺服器同步 |

### 4.6 ZappaJS / Express / Socket.IO

| 項目 | 說明 |
|------|------|
| 套件 | `zappajs` v0.5.x |
| 角色 | Web 框架抽象層，封裝 Express.js 路由 + Socket.IO 事件 |
| CORS | 可透過 `--cors` 旗標啟用跨域資源共享 |
| 傳輸協議 | WebSocket（預設）、xhr-polling、jsonp-polling、flashsocket |

### 4.7 Drupal Sheetnode

| 項目 | 說明 |
|------|------|
| 整合方式 | 客戶端偵測 `window.Drupal.sheetnode`，自動調整房間 ID 與初始化流程 |
| 功能 | 將 EtherCalc 嵌入 Drupal CMS 作為內容節點 |

### 4.8 WebWorker Threads

| 項目 | 說明 |
|------|------|
| 套件 | `webworker-threads`（可選） |
| 角色 | 伺服器端多執行緒運算，每個工作表獨立執行緒 |
| 備援 | 不可用時退回 `vm.CreateContext`（單執行緒） |
| 用途 | SocialCalc 引擎、HTML/CSV 匯出、公式計算、儲存格匯出 |

### 4.9 Cloud Foundry / DotCloud / OpenShift

| 項目 | 說明 |
|------|------|
| Cloud Foundry | 透過 `VCAP_SERVICES` 環境變數自動探索 Redis 服務 |
| DotCloud | 讀取 `/home/dotcloud/environment.json` 取得 Redis 連線資訊 |
| OpenShift | 使用 `OPENSHIFT_DATA_DIR`、`OPENSHIFT_NODEJS_IP`、`OPENSHIFT_NODEJS_PORT` |

---

## 五、安全機制

| 機制 | 說明 |
|------|------|
| HMAC 存取控制 | `--key` 旗標啟用後，以 SHA-256 HMAC 對房間名稱簽章，`auth` 參數需匹配才能執行寫入操作 |
| CORS 限制 | `--cors` 啟用時允許跨域，但 `_rooms`、`_roomlinks`、`_roomtimes` 返回 403 |
| 指令過濾 | 過濾 `set sheet defaulttextvalueformat text-wiki` 指令防止注入 |
| Referrer Policy | HTML 頁面設定 `no-referrer` |
| TLS 支援 | `--keyfile` / `--certfile` 旗標啟用 HTTPS |
