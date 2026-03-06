const express = require("express");
const { WebClient } = require("@slack/web-api");

const app = express();
app.use(express.json());

const token = process.env.SLACK_BOT_TOKEN;
const slack = new WebClient(token);

const CANAL_PRINCIPAL = "C0191AFFM71";
const CANAL_EQUIPO = "C0AGHLBFQTV";

const MARCAS = [
"San Camilo","Barrita Burrito","Sushi Fans","Animal Cocina",
"Sierra Nevada","Juan Valdez","Chorizo Artesano","Lo Saldes",
"Just Burger","Sin Miedo","Shaka","Voraz",
"Mekong","Bangkok","Fatboy","Delirio",
"Tamashi Sushi","Gari Food","Gari Sushi","Burger Depot"
];

const threadMap = {};
const messageMap = {};

function contieneMarca(text){
  return MARCAS.some(m =>
    text.toLowerCase().includes(m.toLowerCase())
  );
}

app.post("/slack/events", async (req,res)=>{

  const body = req.body;

  if(body.type === "url_verification"){
    return res.send(body.challenge);
  }

  const event = body.event;

  try{

    /* MENSAJES NUEVOS */

    if(event.type === "message" && !event.bot_id){

      const text = event.text || "";

      if(!contieneMarca(text)) return res.sendStatus(200);

      const result = await slack.chat.postMessage({
        channel: CANAL_EQUIPO,
        text
      });

      threadMap[event.ts] = result.ts;
      threadMap[result.ts] = event.ts;

      messageMap[event.ts] = result.ts;
    }

    /* RESPUESTAS EN HILO */

    if(event.type === "message" && event.thread_ts){

      const threadDestino = threadMap[event.thread_ts];
      if(!threadDestino) return res.sendStatus(200);

      const nombre = `<@${event.user}>`;

      const result = await slack.chat.postMessage({
        channel: CANAL_EQUIPO,
        thread_ts: threadDestino,
        text: `*${nombre}:*\n${event.text}`
      });

      messageMap[event.ts] = result.ts;
    }

    /* REACCIONES */

    if(event.type === "reaction_added"){

      const tsDestino = messageMap[event.item.ts];
      if(!tsDestino) return res.sendStatus(200);

      await slack.reactions.add({
        channel: CANAL_EQUIPO,
        timestamp: tsDestino,
        name: event.reaction
      });
    }

  }catch(e){
    console.log(e);
  }

  res.sendStatus(200);

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Bot corriendo en puerto", PORT);
});