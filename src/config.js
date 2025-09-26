export const CONFIG = {
  APPSCRIPT_POST_URL: 'https://script.google.com/macros/s/AKfycbzOmu9QDWfoec44Ro56KEvIWoQ_5NrPZOz02LnApP6WAUibBOnF9J93piRJMN8RgpDc/exec',
  SHEET_ID: '1gao04rqA5ZXfMUImijNE52Ls7iw-f5BBJPULoRODjt8',
  SHEET_NAME: 'हनुमान झांकी - मानव कल्याण केंद्र धर्मशाला (Responses)',
  // Optional: Apps Script doGet endpoint returning JSON { ok: true, data: [] }
  APPSCRIPT_GET_URL: ''
};

export const sheetCsvUrl = (sheetId, sheetName) =>
  `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
