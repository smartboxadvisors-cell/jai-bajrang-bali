# Bajrangbali Visitor Dashboard

A production-ready React (Vite) single-page app for capturing visitor registrations in Hindi and visualising Google Sheet data via live dashboards.

## Features
- पूर्णतः हिन्दी लेबल के साथ आगंतुक पंजीकरण फॉर्म (Google Apps Script को POST)
- Google Sheet से लाइव KPI कार्ड्स और Chart.js ग्राफ़्स (CSV या JSON endpoint)
- तिथि फ़िल्टर (एकल दिन एवं दिनांक-सीमा) + नाम/मोबाइल खोज
- टोस्ट सूचनाएँ, लोडिंग स्केलेटन, और नेटवर्क त्रुटि रीट्राई
- Netlify/Vercel पर सरल परिनियोजन

## Tech Stack
- React 19 + Vite
- Tailwind CSS 3
- react-router-dom, react-hot-toast
- chart.js + react-chartjs-2
- PapaParse (CSV parsing)

## Getting Started
```bash
npm install
npm run dev
```

Production build:
```bash
npm run build
npm run preview
```

## Configure Google Sheet Access

Update `src/config.js` with your deployment values:
```js
export const CONFIG = {
  APPSCRIPT_POST_URL: 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec',
  SHEET_ID: '1gao04rqA5ZXfMUImijNE52Ls7iw-f5BBJPULoRODjt8',
  SHEET_NAME: 'Form Responses',
  // Optional read-only JSON endpoint (Apps Script doGet)
  APPSCRIPT_GET_URL: ''
};
```

The helper `sheetCsvUrl(sheetId, sheetName)` is exported for convenience when publishing the sheet as CSV.

## Google Apps Script (server)
1. Google Sheet → **Extensions → Apps Script**
2. Replace the default code with the following:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const body = JSON.parse(e.postData.contents || "{}");

    // Basic validation
    const toInt = v => (v === "" || v == null ? 0 : parseInt(v, 10));
    const ts = new Date();

    const row = [
      ts,
      body.entryNumber || "",
      body.name || "",
      toInt(body.male),
      toInt(body.female),
      toInt(body.children),
      body.address || "",
      body.mobile || "",
      body.fromWhere || "",
      body.purpose || "",
      body.exitDate || "",
      body.photo || "",
      body.eCard || "",
      body.incomeCard || "",
      body.otherIncomeCard || "",
      body.roomNumber || "",
      body.email || ""
    ];

    sheet.appendRow(row);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// (Optional) Read-only endpoint if you prefer JSON over CSV
function doGet() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const values = sheet.getDataRange().getValues(); // includes header
  const [header, ...rows] = values;
  const data = rows.map(r => Object.fromEntries(header.map((h, i) => [h, r[i]])));
  return ContentService.createTextOutput(JSON.stringify({ ok: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

3. **Deploy → New deployment → Web app**
   - Execute as: *Me*
   - Who has access: *Anyone with the link*
4. Copy the Web App URL into `CONFIG.APPSCRIPT_POST_URL`
5. (Optional) Deploy `doGet` and place that URL into `CONFIG.APPSCRIPT_GET_URL`

## Publish Sheet as CSV (for reads)
1. Google Sheet → **File → Share → Publish to the web**
2. Select the specific tab (must match `SHEET_NAME`) and choose **CSV**
3. Publish and note the generated link (contains the Sheet ID)
4. The app will call `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`

> If you prefer the JSON endpoint, leave `SHEET_ID`/`SHEET_NAME` configured (for fallback) and provide `APPSCRIPT_GET_URL`.

## Frontend Deployment
1. Create production build: `npm run build`
2. Deploy the `dist/` directory
   - **Netlify:** drag `dist/` or set build command `npm run build` with publish directory `dist`
   - **Vercel:** set framework to *Vite*, build command `npm run build`, output `dist`
3. Configure [`CONFIG` values](src/config.js) before building or use environment-specific replacements

## Data Flow
- `/new` फॉर्म JSON payload को Apps Script पर POST करता है → Google Sheet में टाइमस्टैम्प के साथ नई पंक्ति जुड़ती है
- `/` डैशबोर्ड शीट से नवीनतम डेटा (CSV/JSON) लोड करता है, फिल्टर लागू करता है, और KPIs/चार्ट फिर से संगणित करता है
- तिथि फ़िल्टर Timestamp कॉलम (Apps Script सर्वर समय) पर आधारित है
- खोज नाम, मोबाइल, Entry Number एवं "कहा से आये" मान के आधार पर कार्य करती है

## Reliability Notes
- गणना फ़ील्ड खाली होने पर स्वचालित रूप से `0` बनती है; क्लाइंट सत्यापन ऋणात्मक मानों और अवैध तिथियों को रोकता है
- नेटवर्क त्रुटियों पर रीट्राई बटन उपलब्ध; `useSheetData` पुराने fetch रद्द करता है और चार्ट रेंडर को डिबाउंस करता है
- सबमिट बटन POST के दौरान निष्क्रिय रहता है और टोस्ट संदेश सफलता/विफलता दर्शाते हैं

## Next Steps
- (वैकल्पिक) Apps Script में फ़ाइल अपलोड सपोर्ट जोड़ें और Google Drive URL लौटाएँ
- PWA/ऑफ़लाइन सपोर्ट या अतिरिक्त विश्लेषण कार्ड्स शामिल करें
# jai-bajrang-bali
