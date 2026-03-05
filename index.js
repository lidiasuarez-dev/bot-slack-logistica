require("dotenv").config();
const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const canalPrincipal = "C0191AFFM71";
const canalEquipo = "C08B8F8FJUC";

const threadMap = {};

/* -----------------------------
   MENSAJE PRINCIPAL
------------------------------*/

app.event("message", async ({ event, client }) => {

  if (event.channel !== canalPrincipal) return;
  if (event.subtype === "bot_message") return;

  // SOLO mensajes principales
  if (!event.thread_ts) {

    try {

      const resultado = await client.chat.postMessage({
        channel: canalEquipo,
        text: event.text || "Nuevo flujo"
      });

      threadMap[event.ts] = resultado.ts;

      console.log("Flujo replicado");

    } catch (error) {
      console.error("Error replicando flujo:", error);
    }

  }

});

/* -----------------------------
   COMENTARIOS
------------------------------*/

app.event("message", async ({ event, client }) => {

  if (event.channel !== canalPrincipal) return;
  if (!event.thread_ts) return;

  const threadDestino = threadMap[event.thread_ts];

  if (!threadDestino) return;

  try {

    await client.chat.postMessage({
      channel: canalEquipo,
      text: event.text,
      thread_ts: threadDestino
    });

    console.log("Comentario replicado");

  } catch (error) {
    console.error("Error replicando comentario:", error);
  }

});

/* -----------------------------
   REACCIONES
------------------------------*/

app.event("reaction_added", async ({ event, client }) => {

  const threadDestino = threadMap[event.item.ts];

  if (!threadDestino) return;

  try {

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

/* -----------------------------
   INICIAR SERVIDOR
------------------------------*/

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log("⚡ Bot corriendo en puerto", process.env.PORT);
})();