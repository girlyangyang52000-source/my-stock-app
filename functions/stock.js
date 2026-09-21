export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const codesParam = url.searchParams.get("codes") || "";
    const codes = codesParam ? codesParam.split(",") : [];

    // 同時向證交所與櫃買中心官方公開 API 抓取最新市場行情
    const [twseRes, tpexRes] = await Promise.all([
      fetch("https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=json").catch(() => null),
      fetch("https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes").catch(() => null)
    ]);

    let priceMap = {};

    if (twseRes && twseRes.ok) {
      const twseJson = await twseRes.json();
      if (twseJson && Array.isArray(twseJson.data)) {
        twseJson.data.forEach(item => {
          // item[0] 為代號, item[7] 為收盤價/成交價
          if (item[0] && item[7]) {
            priceMap[String(item[0]).trim()] = String(item[7]).replace(/,/g, '').trim();
          }
        });
      }
    }

    if (tpexRes && tpexRes.ok) {
      const tpexJson = await tpexRes.json();
      if (Array.isArray(tpexJson)) {
        tpexJson.forEach(item => {
          const code = item.SecuritiesCompanyCode || item.Code;
          const price = item.Close || item.ClosingPrice;
          if (code && price) {
            priceMap[String(code).trim()] = String(price).replace(/,/g, '').trim();
          }
        });
      }
    }

    let resultData = [];
    codes.forEach(code => {
      if (priceMap[code]) {
        resultData.push({ Code: code, ClosingPrice: priceMap[code] });
      }
    });

    return new Response(JSON.stringify({ success: true, data: resultData }), {
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
