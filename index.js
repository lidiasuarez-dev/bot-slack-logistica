require("dotenv").config();
const { App } = require("@slack/bolt");

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const canalPrincipal = "C0191AFFM71";
const canalEquipo = "C08B8F8FJUC";

const threadMap = {};
const messageMap = {};

/* -----------------------------
   MENSAJE PRINCIPAL
------------------------------*/

app.event("message", async ({ event, client }) => {

  if (event.channel !== canalPrincipal) return;
  if (event.subtype === "bot_message") return;

  try {

    // MENSAJE PRINCIPAL
    if (!event.thread_ts) {

      const res = await client.chat.postMessage({
        channel: canalEquipo,
        text: event.text || "Nuevo flujo"
      });

      threadMap[event.ts] = res.ts;
      messageMap[event.ts] = res.ts;

      console.log("Flujo replicado");

    }

    // MENSAJE EN HILO
    else {

      const destinoThread = threadMap[event.thread_ts];

      if (!destinoThread) return;

      const res = await client.chat.postMessage({
        channel: canalEquipo,
        text: event.text,
        thread_ts: destinoThread
      });

      messageMap[event.ts] = res.ts;

      console.log("Comentario replicado");

    }

  } catch (error) {
    console.error("Error replicando mensaje:", error);
  }

});

/* -----------------------------
   REACCIONES
------------------------------*/

app.event("reaction_added", async ({ event, client }) => {

  try {

    const destino = messageMap[event.item.ts];

    if (!destino) return;

    await client.reactions.add({
      channel: canalEquipo,
      name: event.reaction,
      timestamp: destino
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