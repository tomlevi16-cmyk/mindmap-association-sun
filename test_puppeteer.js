const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Navigate to our local server
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });

  // Get the exported JSON from the page
  const jsonStr = await page.evaluate(() => {
    return myDiagram.model.toJson();
  });

  console.log("Exported JSON (first 200 chars):", jsonStr.substring(0, 200));

  // Try to parse it the way app.js does it
  const parsed = JSON.parse(jsonStr);
  console.log("Parsed JSON has nodes:", !!parsed.nodeDataArray);
  
  await browser.close();
})();
