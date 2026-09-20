export async function onRequestGet(context) {
  try {
    const url = "https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=json";
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ success: false, error: "TWSE API HTTP error: " + response.status }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    const json = await response.json();
    
    // 支援多種證交所回傳格式 (data 或 stat 等)
    let stockList = [];
    if (Array.isArray(json.data)) {
      stockList = json.data.map(item => ({
        Code: item[0],
        Name: item[1],
        ClosingPrice: item[7] // 收盤價通常在第 7 個欄位
      }));
    } else if (Array.isArray(json)) {
      stockList = json;
    } else {
      return new Response(JSON.stringify({ success: false, error: "Unknown data structure", raw: json }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
      });
    }

    return new Response(JSON.stringify({ success: true, data: stockList }), {
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
