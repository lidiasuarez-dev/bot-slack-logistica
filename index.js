require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

app.event('message', async ({ event, client }) => {

  if (event.bot_id) return;

  console.log("Mensaje recibido:", event.text);

  await client.chat.postMessage({
    channel: process.env.CANAL_EQUIPO,
    text: event.text || "mensaje sin texto"
  });

});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡️ Servidor corriendo en puerto ' + (process.env.PORT || 3000));
})();
