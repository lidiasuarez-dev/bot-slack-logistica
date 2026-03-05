require("dotenv").config();
const { App, ExpressReceiver } = require("@slack/bolt");

// Creamos el receiver para exponer /slack/events
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: "/slack/events"
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

const canalPrincipal = process.env.CANAL_PRINCIPAL;
const canalEquipo = process.env.CANAL_EQUIPO;

let mapaHilos = {};

// MENSAJES
app.event("message", async ({ event, client }) => {

  if (event.channel !== canalPrincipal) return;

  try {

    const res = await client.chat.postMessage({
      channel: canalEquipo,
      text: event.text || "(mensaje sin texto)"
    });

    mapaHilos[event.ts] = res.ts;

    console.log("Flujo replicado");

  } catch (error) {
    console.error("Error replicando flujo:", error);
  }

});

// COMENTARIOS EN HILOS
app.event("message", async ({ event, client }) => {

  if (!event.thread_ts) return;
  if (event.channel !== canalPrincipal) return;

  const hiloDestino = mapaHilos[event.thread_ts];

  if (!hiloDestino) return;

  try {

    await client.chat.postMessage({
      channel: canalEquipo,
      thread_ts: hiloDestino,
      text: event.text
    });

    console.log("Comentario replicado");

  } catch (error) {
    console.error("Error replicando comentario:", error);
  }

});

// REACCIONES
app.event("reaction_added", async ({ event, client }) => {

  if (event.channel !== canalPrincipal) return;

  const hiloDestino = mapaHilos[event.item.ts];

  if (!hiloDestino) return;

  try {

    await client.reactions.add({
      channel: canalEquipo,
      name: event.reaction,
      timestamp: hiloDestino
    });

    console.log("Reacción replicada");

  } catch (error) {
    console.error("Error replicando reacción:", error);
  }

});

// Arranca servidor
const PORT = process.env.PORT || 3000;

receiver.app.listen(PORT, () => {
  console.log("⚡ Bot corriendo en puerto", PORT);
});