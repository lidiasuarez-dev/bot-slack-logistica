require("dotenv").config();
const { App, ExpressReceiver } = require("@slack/bolt");

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

const mapaHilos = {};

app.event("message", async ({ event, client }) => {

  if (event.channel !== canalPrincipal) return;
  if (event.subtype === "bot_message" && !event.thread_ts) return;

  try {

    // MENSAJE PRINCIPAL (flujo)
    if (!event.thread_ts) {

      const res = await client.chat.postMessage({
        channel: canalEquipo,
        text: event.text || "(sin texto)"
      });

      mapaHilos[event.ts] = res.ts;

      console.log("Flujo replicado");

      return;
    }

    // COMENTARIO EN HILO
    const hiloDestino = mapaHilos[event.thread_ts];

    if (!hiloDestino) return;

    await client.chat.postMessage({
      channel: canalEquipo,
      thread_ts: hiloDestino,
      text: event.text
    });

    console.log("Comentario replicado en hilo");

  } catch (error) {

    console.error("Error replicando mensaje:", error);

  }

});


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


const PORT = process.env.PORT || 3000;

receiver.app.listen(PORT, () => {
  console.log("⚡ Bot corriendo en puerto", PORT);
});