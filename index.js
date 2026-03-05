require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.event('message', async ({ event, client }) => {

  console.log("Evento recibido:", event);

  // evitar loop del propio bot
  if (event.bot_id && event.bot_id === process.env.BOT_ID) return;

  // solo escuchar canal principal
  if (event.channel !== process.env.CANAL_PRINCIPAL) return;

  let texto = event.text || "";

  // si el mensaje viene en bloques (flows)
  if (event.blocks) {
    texto += "\n";
  }

  console.log("Enviando al canal equipo:", texto);

  await client.chat.postMessage({
    channel: process.env.CANAL_EQUIPO,
    text: texto
  });

});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bot corriendo en puerto", process.env.PORT);
})();