const { chromium } = require("playwright");

async function loginAndGetToken(page) {
  await page.goto("https://painelslim.site");

  await page.fill('input[name="username"]', String(process.env.LOGIN_SLIM));
  await page.fill('input[name="password"]', String(process.env.PASSWORD_SLIM));

  await page.click('button[type="submit"]');

  // espera login
  await page.waitForSelector("#kt_body", { timeout: 15000 });

  console.log("✅ Login realizado!");

  await page.waitForTimeout(2000);

  const token = await page.evaluate(() => localStorage.getItem("token"));

  console.log("🔑 TOKEN:", token);

  return token;
}

module.exports = { loginAndGetToken };
