require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.event('message', async ({ event, client }) => {

  console.log("Evento recibido:", event);

  // evitar que replique lo que el mismo bot publica
  if (event.bot_id) return;

  // solo escuchar canal principal
  if (event.channel !== process.env.CANAL_PRINCIPAL) return;

  const texto = event.text || "";

  console.log("Mensaje detectado:", texto);

  await client.chat.postMessage({
    channel: process.env.CANAL_EQUIPO,
    text: texto
  });

});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bot corriendo en puerto", process.env.PORT);
})();