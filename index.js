require('dotenv').config();
const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const threadMap = {};

const MARCAS = [
  "San Camilo", "Barrita Burrito", "Sushi Fans", "Animal Cocina",
  "Sierra Nevada", "Juan Valdez", "Chorizo Artesano", "Lo Saldes",
  "Just Burger", "Sin Miedo", "Shaka", "Voraz",
  "Mekong", "Bangkok", "Fatboy", "Delirio",
  "Tamashi Sushi", "Gari Food", "Gari Sushi",
  "Burger Depot"
];

/* =========================
   MENSAJES PRINCIPALES
========================= */

app.event('message', async ({ event, client }) => {

  if (event.channel !== process.env.CANAL_PRINCIPAL) return;

  if (event.thread_ts) return;

  let texto = event.text || "";

  const contieneMarca = MARCAS.some(m =>
    texto.toLowerCase().includes(m.toLowerCase())
  );

  if (!contieneMarca) return;

  try {

    const enviado = await client.chat.postMessage({
      channel: process.env.CANAL_EQUIPO,
      text: texto,
      blocks: event.blocks || undefined
    });

    // guardar relación de hilos
    threadMap[event.ts] = enviado.ts;

    console.log("Hilo mapeado:", event.ts, "→", enviado.ts);

  } catch (error) {
    console.error("Error enviando mensaje:", error);
  }

});

/* =========================
   RESPUESTAS EN HILOS
========================= */

app.event('message', async ({ event, client }) => {

  if (!event.thread_ts) return;

  if (event.channel !== process.env.CANAL_PRINCIPAL) return;

  const threadDestino = threadMap[event.thread_ts];

  if (!threadDestino) return;

  try {

    await client.chat.postMessage({
      channel: process.env.CANAL_EQUIPO,
      text: event.text,
      thread_ts: threadDestino
    });

  } catch (error) {
    console.error("Error replicando respuesta:", error);
  }

});

/* =========================
   REACCIONES
========================= */

app.event('reaction_added', async ({ event, client }) => {

  const threadDestino = threadMap[event.item.ts];

  if (!threadDestino) return;

  try {

    await client.reactions.add({
      channel: process.env.CANAL_EQUIPO,
      timestamp: threadDestino,
      name: event.reaction
    });

  } catch (error) {
    console.error("Error replicando reacción:", error);
  }

});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡️ Bot sincronizando hilos en puerto", process.env.PORT);
});