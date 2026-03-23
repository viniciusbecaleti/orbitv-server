const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const { chromium } = require("playwright");
const { loginAndGetToken } = require("./login");

const app = express();
app.use(express.json());

let context;
let page;
let token;

function gerarNumero() {
  return Math.floor(100000000 + Math.random() * 900000000).toString();
}

(async () => {
  const browser = await chromium.launch({
    headless: false, // deixa visível pra testar
    args: ["--no-sandbox"],
  });

  context = await browser.newContext();
  page = await context.newPage();

  console.log("🔐 Fazendo login automático...");
  token = await loginAndGetToken(page);

  console.log("✅ Tudo pronto!");
})();

// 🔥 endpoint funcionando
app.post("/criar", async (req, res) => {
  try {
    const username = gerarNumero();
    const password = gerarNumero();

    const result = await page.evaluate(
      async ({ username, password }) => {
        const token = localStorage.getItem("token");

        const response = await fetch("/api/customers", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
            accept: "application/json",
            locale: "pt",
          },
          body: JSON.stringify({
            server_id: "BV4D3rLaqZ",
            package_id: "BKADdn1lrn",
            trial_hours: 1,
            connections: 1,
            bouquets: "",
            parent_can_edit_personal_data: "YES",
            username,
            password,
          }),
        });

        const text = await response.text();

        try {
          return {
            ok: true,
            data: JSON.parse(text),
          };
        } catch {
          return {
            ok: false,
            status: response.status,
            raw: text,
          };
        }
      },
      { username, password },
    );

    console.log("📡 API:", result);

    if (!result.ok) {
      return res.json(result);
    }

    // 🗓️ tenta pegar vencimento da resposta
    const vencimento =
      result.data?.expiration_date || result.data?.expires_at || "N/A";

    // 🧾 monta mensagem
    const mensagem = `
🗓️ *Vencimento:* ${vencimento}

✅ *Usuário:* ${username}
✅ *Senha:* ${password}

*Preencha o ABSOLUTO Player  conforme abaixo:*
*Campo 1:* slim
*Campo 2:* ${username}
*Campo 3:* ${password}

*Preencha o IPTV Smarters conforme abaixo:*
*Campo 1:* SlimTV
*Campo 2:* ${username}
*Campo 3:* ${password}
*Campo 4:* http://caderno.online

*Preencha o XCIPTV conforme abaixo:*
*Campo 1:* http://caderno.online
*Campo 2:* ${username}
*Campo 3:* ${password}

*Parceria APP EasyPlayer:*
Código: slim01

*DNS STB / Smart UP*
Opção 01 v3: 162.212.154.241
Opção 02 v2: 49.13.95.95
Opção 03 v2: 65.108.245.51
Opção 04 v2: 5.161.202.43

📱 *Apps Android:*
appslim.cc/smart
appslim.cc/fast 
appslim.cc/ibo
 
🟢 *Lista M3U:*
http://caderno.online/get.php?username=${username}&password=${password}&type=m3u_plus&output=mpegts

🟢 *Link SSIPTV:*
http://e.caderno.online/p/${username}/${password}/ssiptv

⚠️ Remova o "s" do https:// se necessário

*EPG:*
http://caderno.online/xmltv.php?username=${username}&password=${password}

📺 *Webplayer:* 
01.webplayer.top
https://slim.webplayer.top

💳 *Renovar:*
https://painelslim.site/#/checkout/V4D34k9Waq/2YD0ev2PWQ
`;

    res.json({
      sucesso: true,
      username,
      password,
      mensagem,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro");
  }
});

app.listen(3000, () => {
  console.log("🌍 http://localhost:3000");
});
