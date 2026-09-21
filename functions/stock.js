export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const codesParam = url.searchParams.get("codes") || "";
    const codes = codesParam ? codesParam.split(",") : [];

    let priceMap = {};

    // 1. 同時向上市與上櫃的官方公開 API 抓取完整最新行情
    const [twseRes, tpexRes] = await Promise.all([
      fetch("https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=json").catch(() => null),
      fetch("https://www.tpex.org.tw/openapi/v1/tpex_mainboard_quotes").catch(() => null)
    ]);

    if (twseRes && twseRes.ok) {
      const twseJson = await twseRes.json();
      if (twseJson && Array.isArray(twseJson.data)) {
        twseJson.data.forEach(item => {
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

    // 2. 針對個別即時接口做備用補強查詢
    for (const code of codes) {
      if (!priceMap[code]) {
        try {
          const res = await fetch(`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${code}.tw|otc_${code}.tw`, {
            headers: { "User-Agent": "Mozilla/5.0" }
          });
          const json = await res.json();
          if (json && Array.isArray(json.msgArray) && json.msgArray.length > 0) {
            const item = json.msgArray[0];
            const price = (item.z && item.z !== "-") ? item.z : (item.y && item.y !== "-" ? item.y : null);
            if (price) {
              priceMap[code] = String(price);
            }
          }
        } catch (e) {}
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
