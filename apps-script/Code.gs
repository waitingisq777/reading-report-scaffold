/**
 * 閱讀心得寫作鷹架系統 — 老師後台同步用 Apps Script
 *
 * 設定步驟：
 * 1. 開一個新的 Google 試算表
 * 2. 上方選單「擴充功能」→「Apps Script」
 * 3. 把這個檔案的內容全部貼進去，取代預設內容
 * 4. 左側「專案設定」→「指令碼屬性」→ 新增一筆：
 *      屬性：TEACHER_KEY　值：（自己設一組密碼，例如 elc1s2026）
 * 5. 右上「部署」→「新增部署作業」→ 類型選「網頁應用程式」
 *      執行身分：我　　誰可以存取：所有人
 * 6. 部署後複製「網頁應用程式」網址（結尾是 /exec），
 *    貼到 index.html 和 teacher-dashboard.html 裡的 SYNC_URL
 *
 * 每次修改這個檔案之後，都要回到「部署」→「管理部署作業」→ 編輯（鉛筆圖示）
 * → 版本選「新版本」→ 部署，否則 /exec 網址還是會執行修改前的舊程式碼。
 */

const SHEET_NAME = '學生進度';
const HEADERS = ['studentId', '姓名', '學校', '年級', '班級', '書名', '作者',
  '總字數', '完成度', '段落一_簡介', '段落二_摘錄', '段落三_觀點', '段落四_議題', '最後更新'];

function doPost(e) {
  const sheet = getSheet_();
  const data = JSON.parse(e.postData.contents);
  upsertRow_(sheet, data);
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const key = PropertiesService.getScriptProperties().getProperty('TEACHER_KEY');
  if (!key || e.parameter.key !== key) {
    return ContentService.createTextOutput(JSON.stringify({ error: '無權限，密碼錯誤' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const headers = values.shift();
  const result = values.map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADERS);
  }
  return sheet;
}

function upsertRow_(sheet, data) {
  const values = sheet.getDataRange().getValues();
  let rowIndex = -1;
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === data.studentId) { rowIndex = i + 1; break; }
  }
  const row = [
    data.studentId || '',
    data.name || '',
    data.school || '',
    data.grade || '',
    data.class || '',
    data.title || '',
    data.author || '',
    data.totalCount || 0,
    (data.progress || 0) + '%',
    data.intro || '',
    data.excerpt || '',
    data.opinion || '',
    data.topics || '',
    new Date()
  ];
  if (rowIndex === -1) {
    sheet.appendRow(row);
  } else {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  }
}
