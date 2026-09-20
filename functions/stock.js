export async function onRequestGet(context) {
  try {
    // 透過穩定的公開財經資料 API 獲取台股即時行情
    const response = await fetch("https://api.github.com/repos/mispy/stock_data_tw/contents/latest.json", {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "application/vnd.github.v3.raw"
      }
    });

    // 如果備用開源資料源異常，我們提供一組安全的即時查詢轉發
    let stockMap = {};
    if (response.ok) {
      const data = await response.json();
      // 假設格式，若無則走底下備用即時查詢
      stockMap = data;
    }

    // 為了確保萬無一失且兼顧「非寫死、能隨時變動」，我們同時串接證交所與櫃買中心最新的公開個股日行情 API
    const twseRes = await fetch("https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=json");
    const twseJson = twseRes.ok ? await twseRes.json() : null;

    let formattedData = [];

    // 如果證交所 API 正常回應，直接解析最新成交價
    if (twseJson && Array.isArray(twseJson.data)) {
      formattedData = twseJson.data.map(item => ({
        Code: String(item[0]).trim(),
        ClosingPrice: String(item[7]).replace(/,/g, '').trim() // 收盤價/即時成交價
      }));
    }

    // 同步補上櫃買中心 (TPEx) 資料以支援尼克森等上櫃股
    const tpexRes = await fetch("https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes");
    const tpexJson = tpexRes.ok ? await tpexRes.json() : null;
    if (tpexJson && Array.isArray(tpexJson)) {
      tpexJson.forEach(item => {
        if (item.SecuritiesCompanyCode && item.Close) {
          formattedData.push({
            Code: String(item.SecuritiesCompanyCode).trim(),
            ClosingPrice: String(item.Close).replace(/,/g, '').trim()
          });
        }
      });
    }

    return new Response(JSON.stringify({ success: true, data: formattedData }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
}
