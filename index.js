require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const canalPrincipal = process.env.CANAL_PRINCIPAL;
const canalEquipo = process.env.CANAL_EQUIPO;

/* =========================
   COPIAR MENSAJES
========================= */

app.event('message', async ({ event, client }) => {

  if (event.channel !== canalPrincipal) return;

  if (event.bot_id) return;

  try {

    const texto = event.text || "(mensaje sin texto)";

    await client.chat.postMessage({
      channel: canalEquipo,
      text: texto
    });

    console.log("Mensaje replicado");

  } catch (error) {
    console.error("Error copiando mensaje:", error);
  }

});


/* =========================
   COPIAR REACCIONES
========================= */

app.event('reaction_added', async ({ event, client }) => {

  try {

    await client.chat.postMessage({
      channel: canalEquipo,
      text: `:${event.reaction}: reacción agregada`
    });

    console.log("Reacción detectada");

  } catch (error) {
    console.error("Error reacción:", error);
  }

});


/* =========================
   SERVIDOR
========================= */

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡ Bot corriendo en puerto", process.env.PORT);
})();