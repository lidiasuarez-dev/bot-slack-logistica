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

const mapaMensajes = {};

app.event("message", async ({ event, client }) => {

  try {

    if (event.channel !== canalPrincipal) return;

    const texto = event.text || "(sin texto)";

    // TS raíz del hilo
    const threadRaiz = event.thread_ts || event.ts;

    let threadDestino = mapaMensajes[threadRaiz];

    // SI NO EXISTE, CREAR MENSAJE PRINCIPAL
    if (!threadDestino) {

      const res = await client.chat.postMessage({
        channel: canalEquipo,
        text: texto
      });

      mapaMensajes[threadRaiz] = res.ts;

      console.log("Flujo replicado");

      return;
    }

    // SI EXISTE → ES COMENTARIO
    await client.chat.postMessage({
      channel: canalEquipo,
      thread_ts: threadDestino,
      text: texto
    });

    console.log("Comentario replicado en hilo");

  } catch (error) {

    console.error("Error replicando mensaje:", error);

  }

});


app.event("reaction_added", async ({ event, client }) => {

  try {

    if (event.channel !== canalPrincipal) return;

    const threadDestino = mapaMensajes[event.item.ts];

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


const PORT = process.env.PORT || 3000;

receiver.app.listen(PORT, () => {
  console.log("⚡ Bot corriendo en puerto", PORT);
});