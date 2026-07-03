# 老師後台設定教學（Firebase 版，免寫程式碼）

這份文件教您把「學生端」（`index.html`）與「老師後台」（`teacher-dashboard.html`）接上 Firebase，
之後學生填寫時會自動同步，老師開啟後台網頁就能即時看到全班進度，**不需要用到 Apps Script**。

全程約 15–20 分鐘，只需要一個 Google 帳號。

---

## 第一步：建立 Firebase 專案

1. 開啟 <https://console.firebase.google.com>，用 Google 帳號登入。
2. 點「新增專案」，輸入專案名稱（例如：`elc1s-reading-report`），一路「繼續」到完成建立（不需要開啟 Google Analytics，可以關掉）。

## 第二步：啟用 Firestore 資料庫

1. 左側選單「建構」→「Firestore Database」→「建立資料庫」。
2. 位置選 `asia-east1`（台灣/香港附近），模式選「**正式版模式**」（production mode）。
3. 建立完成後，先不用理會規則，稍後第五步會設定。

## 第三步：啟用登入方式（Authentication）

1. 左側選單「建構」→「Authentication」→「開始使用」。
2. 在「Sign-in method」分頁，啟用兩種登入方式：
   - **匿名**（Anonymous）：學生端用，讓學生不用註冊帳號就能寫入自己的資料。
   - **電子郵件/密碼**（Email/Password）：老師端用，用來登入後台。
3. 切到「Users」分頁，點「新增使用者」，建立**您自己的老師帳號**（例如 `teacher@example.com` + 自訂密碼）。這組帳密就是之後登入後台用的。

## 第四步：取得 Firebase 設定值（firebaseConfig）

1. 左上角齒輪圖示「專案設定」→ 拉到「一般」分頁最下方「您的應用程式」。
2. 點 `</>`（網頁）圖示，輸入應用程式暱稱（例如 `reading-report`），點「註冊應用程式」。
3. 會看到一段 `const firebaseConfig = { apiKey: "...", authDomain: "...", ... }`，把整段**複製起來**。
4. 打開這個專案的兩個檔案：
   - `index.html`：搜尋 `firebaseConfig`，把裡面 `PASTE_YOUR_...` 的內容換成您複製的那一組。
   - `teacher-dashboard.html`：同樣搜尋 `firebaseConfig`，貼上**完全相同**的設定值。

## 第五步：設定資料安全規則（Firestore Rules）

回到「Firestore Database」→「規則」分頁，把內容整段換成以下規則，再按「發布」：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /reports/{studentId} {
      // 只有登入的老師帳號能讀取全班資料，請把 email 換成您在第三步建立的老師帳號
      allow read: if request.auth != null
                   && request.auth.token.email == 'teacher@example.com';

      // 學生端用「姓名」登入（不是帳號密碼），所以這裡只確認有經過匿名登入、
      // 且送出的資料欄位符合預期格式，無法真正驗證「這個姓名是不是本人」。
      allow write: if request.auth != null
                    && request.resource.data.keys().hasOnly([
                         'studentId','name','school','grade','class','title','author',
                         'intro','excerpt','opinion','topics','totalCount','progress','updatedAt'
                       ]);
    }
  }
}
```

**請務必把規則裡的 `teacher@example.com` 改成您真正的老師帳號 email**，否則老師後台會顯示「讀取資料失敗」。

> ⚠️ **姓名登入的小提醒**：學生端現在是「輸入姓名即可使用」，雲端資料是用姓名（去除特殊字元後）當作識別依據。這代表：
> - 換裝置時，只要輸入**同樣的姓名**，就會接續同一份雲端記錄，方便學生在不同電腦間切換。
> - 但如果**兩位學生打了完全相同的姓名**，會共用同一份記錄、互相覆蓋。建議提醒學生務必填寫全名；如需完全避免同名問題，可請學生在姓名後加上座號（例如「陳小明08」）。
> - 這不是真正的帳號驗證（沒有密碼），純粹用姓名字串識別，安全性等同原本的班級共用連結，適合教室內部使用情境。

## 第六步：把網頁部署到公開網址

Firebase 需要透過網址（`https://...`）存取，不能直接用「雙擊打開檔案」的方式（`file://`）使用同步功能。
最簡單的做法是沿用您原本的 GitHub repository，開啟 GitHub Pages：

1. 到 GitHub 上的 `reading-report-scaffold` repository →「Settings」→「Pages」。
2. Source 選擇 `main` 分支、根目錄 `/`，儲存。
3. 幾分鐘後會產生一個網址，例如 `https://waitingisq777.github.io/reading-report-scaffold/index.html`。
4. 把學生端網址提供給學生（或內嵌到 Google Sites 的「嵌入 HTML」區塊），老師後台網址（`teacher-dashboard.html`）自己保留使用。

## 第七步：授權網域

1. 回到 Firebase「Authentication」→「Settings」→「Authorized domains」。
2. 確認您的 GitHub Pages 網域（例如 `waitingisq777.github.io`）在清單中；如果沒有，點「新增網域」加入。
   若有內嵌到 Google Sites，通常不需要額外加 Sites 網域，因為實際載入的還是 GitHub Pages 的內容。

---

## 完成後如何確認有正常運作

1. 開啟學生端網頁，會先看到「輸入姓名」的登入畫面，輸入姓名後填寫任一欄位，右下角應該會顯示「☁️ 同步中…」→「☁️ 已同步 HH:MM」。
2. 開啟老師後台，用第三步建立的帳密登入，應該能立刻看到剛剛那筆資料，且**畫面會自動即時更新**（不需要手動重新整理）。

## 常見問題

- **老師後台顯示「讀取資料失敗」**：通常是第五步規則裡的 email 打錯，或還沒按「發布」。
- **學生端一直顯示「連線中…」不會變成已同步**：確認 `index.html` 裡的 `firebaseConfig` 有換成您自己的值，而不是還留著 `PASTE_YOUR_...`。
- **想砍掉某個學生的重複資料**：到 Firebase Console →「Firestore Database」→「資料」分頁，找到 `reports` collection，手動刪除該筆文件即可。
- **免費額度夠用嗎？**：Firestore 免費額度為每天 5 萬次讀取、2 萬次寫入，一個班級（30–40 人）的使用量完全在範圍內。
