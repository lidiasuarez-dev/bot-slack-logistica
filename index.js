require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.BOT_TOKEN,
  signingSecret: process.env.SIGNING_SECRET
});

app.event('message', async ({ event, client }) => {

  if (event.bot_id) return;

  if (event.channel !== process.env.CANAL_PRINCIPAL) return;

  const texto = event.text || "";

  const marcas = [
    "San Camilo",
    "Barrita Burrito",
    "Sushi Fans"
  ];

  const contieneMarca = marcas.some(m =>
    texto.toLowerCase().includes(m.toLowerCase())
  );

  if (!contieneMarca) return;

  await client.chat.postMessage({
    channel: process.env.CANAL_EQUIPO,
    text: texto
  });

});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Bot corriendo en puerto 3000');
})();
