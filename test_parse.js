const fs = require('fs');

const text = `{ "class": "GraphLinksModel",
  "nodeDataArray": [
    {"key":1, "text":"למה רוגע היא\nמטרה בחיים?", "fill":"#ffb300", "stroke":"#ff8f00", "fontSize":16, "isBold":true, "shape":"RoundedRectangle"}
  ],
  "linkDataArray": []
}`;

try {
    const parsed = JSON.parse(text);
    console.log("JSON.parse success:", !!parsed.nodeDataArray);
} catch (e) {
    console.log("JSON.parse error:", e.message);
}

