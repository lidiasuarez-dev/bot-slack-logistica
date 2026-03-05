require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const canalPrincipal = process.env.CANAL_PRINCIPAL;
const canalEquipo = process.env.CANAL_EQUIPO;

/* memoria simple de hilos */
const mapaHilos = {};

/* =========================
   MENSAJES
========================= */

app.event('message', async ({ event, client }) => {

  if (event.bot_id) return;
  if (event.subtype === 'message_changed') return;

  if (event.channel !== canalPrincipal) return;

  let texto = event.text || "";

  if (!texto && event.blocks) {
    texto = JSON.stringify(event.blocks, null, 2);
  }

  if (!texto) texto = "(sin texto)";

  try {

    /* MENSAJE PRINCIPAL (FLUJO) */
    if (!event.thread_ts) {

      const enviado = await client.chat.postMessage({
        channel: canalEquipo,
        text: texto
      });

      mapaHilos[event.ts] = enviado.ts;

      console.log("Flujo replicado");

    }

    /* RESPUESTA EN HILO */
    else {

      const hiloDestino = mapaHilos[event.thread_ts];

      if (!hiloDestino) return;

      await client.chat.postMessage({
        channel: canalEquipo,
        thread_ts: hiloDestino,
        text: texto
      });

      console.log("Respuesta replicada");

    }

  } catch (error) {
    console.error("Error replicando mensaje:", error);
  }

});


/* =========================
   REACCIONES
========================= */

app.event('reaction_added', async ({ event, client }) => {

  try {

    const threadDestino = mapaHilos[event.item.ts];

    if (!threadDestino) return;

    await client.reactions.add({
      channel: canalEquipo,
      name: event.reaction,
      timestamp: threadDestino
    });

    console.log("Reacción replicada");

  } catch (error) {
    console.error("Error replicando reacción:", error);
  }

});


/* =========================
   SERVIDOR
========================= */

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡ Bot corriendo en puerto", process.env.PORT);
})();