export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const codesParam = url.searchParams.get("codes") || "";
    const codes = codesParam ? codesParam.split(",") : [];

    let resultData = [];

    // 動態向證交所及櫃買中心官方公開行情接口請求當下真實成交價
    for (const code of codes) {
      try {
        const res = await fetch(`https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=tse_${code}.tw|otc_${code}.tw`, {
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        const json = await res.json();
        
        if (json && Array.isArray(json.msgArray) && json.msgArray.length > 0) {
          const item = json.msgArray[0];
          // 優先取盤中成交價 (z)，若無則取昨收價 (y)
          const price = (item.z && item.z !== "-") ? item.z : (item.y && item.y !== "-" ? item.y : null);
          if (price) {
            resultData.push({ Code: code, ClosingPrice: String(price) });
          }
        }
      } catch (e) {
        // 略過單支失敗
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
