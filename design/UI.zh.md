# EtherCalc 使用者介面功能文件

## 一、首頁（Start Page）

| 功能 | 說明 | 入口 |
|------|------|------|
| 建立新試算表 | 產生隨機 UUID 作為房間名稱，跳轉進入編輯 | `/_new` 或首頁按鈕 |
| 拖放匯入檔案 | 拖放 `.csv`、`.ods`、`.xlsx` 至首頁即可匯入並建立試算表 | `/_start` 拖放區 |
| 上傳時命名工作表 | 勾選「Rename sheet(s) after upload」可在匯入時自訂名稱 | 首頁 checkbox |

---

## 二、試算表編輯器（Spreadsheet Editor）

### 2.1 即時協作

| 功能 | 說明 |
|------|------|
| 多人即時編輯 | 透過 WebSocket（Socket.IO）同步，所有使用者的操作即時反映 |
| 游標位置同步 | 顯示其他協作者目前選取的儲存格（以顏色高亮） |
| 即時聊天 | 右側聊天面板，可傳送即時訊息（`chat` 事件） |
| 斷線重連 | 斷線後自動重連（最多 1800 次嘗試，每 500ms 間隔） |
| 離線提示 | 瀏覽器離線時顯示錯誤對話框 |

### 2.2 試算表操作

| 功能 | 說明 |
|------|------|
| 儲存格編輯 | 輸入文字、數值、公式 |
| 公式計算 | 支援 SocialCalc 所有內建公式（含跨工作表引用） |
| Wiki 格式 | 預設文字格式為 `text-wiki`，支援 Wikitext 語法渲染 |
| 復原/重做 | SocialCalc 內建的 undo/redo |
| 剪貼簿操作 | 複製/貼上儲存格資料 |
| 欄列操作 | 插入/刪除列、調整欄寬列高 |
| 格式設定 | 儲存格格式、字型、顏色、對齊等 |
| 重新計算 | 強制重新計算整張工作表（`recalc`） |

### 2.3 分頁功能（Tabs）

| 分頁 | 說明 |
|------|------|
| Sheet | 主要試算表檢視 |
| Edit | 編輯工具列 |
| Format | 格式設定工具列 |
| Sort | 排序設定 |
| Audit | 操作稽核記錄 |
| Comment | 儲存格註解 |
| Clipboard | 剪貼簿（可匯入資料） |
| Form | 表單模式入口（顯示 Live Form 按鈕連結） |
| Graph | 圖表檢視（見 2.5） |

### 2.4 匯出功能

| 格式 | 路徑 | 說明 |
|------|------|------|
| CSV | `/{room}.csv` | 逗號分隔值 |
| HTML | `/{room}.html` | 網頁表格 |
| Excel (XLSX) | `/{room}.xlsx` | Excel XML 格式 |
| ODS | `/{room}.ods` | OpenDocument 試算表 |
| FODS | `/{room}.fods` | Flat OpenDocument 試算表 |
| Markdown | `/{room}.md` | Markdown 表格 |
| JSON | `/{room}.csv.json` | CSV 的 JSON 陣列表示 |

匯出時彈出對話框（Vex dialog），使用者可選擇格式下載。

### 2.5 圖表功能（Graph Tab）

| 圖表類型 | 說明 |
|----------|------|
| Vertical Bar | 垂直長條圖 |
| Horizontal Bar | 水平長條圖 |
| Pie Chart | 圓餅圖 |
| Line Chart | 折線圖 |
| Scatter Chart | 散佈圖 |

操作方式：
- 選取儲存格範圍 → 切到 Graph 分頁 → 選擇圖表類型 → 按 OK
- 支援自訂 X/Y 軸最小/最大值（Min X、Max X、Min Y、Max Y）
- 使用 HTML5 Canvas 繪製

---

## 三、多工作表模式（Multi-Sheet）

| 功能 | 說明 | 入口 |
|------|------|------|
| 多工作表檢視 | 以 `=` 前綴的房間名進入，每個子工作表為獨立 iframe | `/=roomname` |
| 新增工作表 | Add 按鈕新增分頁 | 多工作表介面 |
| 重新命名 | Rename 按鈕修改分頁名稱 | 多工作表介面 |
| 刪除工作表 | Delete 按鈕移除分頁 | 多工作表介面 |
| 跨工作表引用 | 公式中可引用其他工作表（自動改寫 `$Sheet名.A1` → `"index.N"!A1`） | 公式輸入 |
| 多工作表匯出 | ODS/XLSX 匯出支援合併多工作表為單一檔案 | `/=room.xlsx`、`/=room.ods` |

---

## 四、存取控制模式

| 模式 | URL 模式 | 說明 |
|------|----------|------|
| 編輯模式 | `/{room}/edit` | 完整讀寫權限（需 `--key` 啟用時透過 HMAC 驗證） |
| 檢視模式 | `/{room}/view` | 唯讀檢視，無法編輯 |
| App 模式 | `/{room}/app` | 應用程式檢視模式（隱藏游標高亮） |
| 無密鑰 | `/{room}` | 未啟用 `--key` 時，任何人皆可編輯 |

---

## 五、表單功能（Form / App）

| 功能 | 說明 | 入口 |
|------|------|------|
| 表單入口 | 基於模板自動複製一份新工作表供使用者填寫 | `/{template}/form` |
| App Editor | 三欄面板：App 檢視 + 試算表編輯 + 表單資料檢視 | `/{template}/appeditor` |
| 表單提交 | 提交表單後資料寫入 `{room}_formdata` 工作表的最後一列 | `submitform` 指令 |
| 表單資料檢視 | 檢視已提交的表單資料 | `/{room}_formdata/view` |

---

## 六、從模板建立

| 功能 | 說明 | 入口 |
|------|------|------|
| 從模板複製 | 複製現有工作表為新房間 | `/_from/{template}` |

---

## 七、國際化（i18n）

| 語言 | 檔案 |
|------|------|
| English | `l10n/en.json` |
| 正體中文 | `l10n/zh-TW.json` |
| 簡體中文 | `l10n/zh-CN.json` |
| Français | `l10n/fr.json` |
| Deutsch | `l10n/de.json` |
| Español | `l10n/es-ES.json` |
| Русский | `l10n/ru-RU.json` |

依瀏覽器 `navigator.language` 自動載入對應語系。

---

## 八、其他 UI 功能

| 功能 | 說明 |
|------|------|
| 離線快取 | 透過 `manifest.appcache` 支援 AppCache 離線使用 |
| PWA 支援 | `manifest.json`、Apple Touch Icon、主題色等 |
| 載入動畫 | 工作表載入中顯示 CSS spinner |
| 自適應大小 | 視窗 resize 時自動調整試算表大小 |
| Drupal 整合 | 支援嵌入 Drupal Sheetnode 模組 |
| 備份還原連結 | ethercalc.net 上提供「View & Restore Backups」連結 |
