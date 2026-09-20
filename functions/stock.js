export async function onRequestGet(context) {
  try {
    // 改用證交所三大法人或個股即時 OpenAPI，或者直接對每檔股票進行查詢，確保格式百分之百穩定
    const url = "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: "TWSE OpenAPI error: " + response.status }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const data = await response.json();
    
    // 統一轉換成前端需要的格式 [{ Code, ClosingPrice }, ...]
    const formattedData = data.map(item => ({
      Code: item.Code || item.StockNo,
      ClosingPrice: item.ClosingPrice || item.TradePrice || item.Price
    }));

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
