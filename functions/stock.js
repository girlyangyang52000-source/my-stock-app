export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const codesParam = url.searchParams.get("codes") || "";
    const codes = codesParam ? codesParam.split(",") : [];

    let resultData = [];

    for (const code of codes) {
      try {
        // 同時向上市 (tse) 與上櫃 (otc) 查詢即時行情
        const res = await fetch(`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${code}.tw|otc_${code}.tw`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const json = await res.json();
        
        if (json && Array.isArray(json.msgArray) && json.msgArray.length > 0) {
          const item = json.msgArray[0];
          const price = (item.z && item.z !== "-") ? item.z : (item.y && item.y !== "-" ? item.y : null);
          if (price) {
            resultData.push({ Code: code, ClosingPrice: String(price) });
          }
        }
      } catch (e) {
        // 略過
      }
    }

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
