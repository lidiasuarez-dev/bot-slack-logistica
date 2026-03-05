require('dotenv').config();
const { App, ExpressReceiver } = require('@slack/bolt');

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

app.event('message', async ({ event, client }) => {

  if (event.bot_id) return;

  if (event.channel !== process.env.CANAL_PRINCIPAL) return;

  const texto = event.text || "";

  const marcas = [
    "San Camilo", "Barrita Burrito", "Sushi Fans", "Animal Cocina",
    "Sierra Nevada", "Juan Valdez", "Chorizo Artesano", "Lo Saldes",
    "Just Burger", "Sin Miedo", "Shaka", "Voraz",
    "Mekong", "Bangkok", "Fatboy", "Delirio",
    "Tamashi Sushi", "Gari Food", "Gari Sushi",
    "Burger Depot"
  ];

  const contieneMarca = marcas.some(m =>
    texto.toLowerCase().includes(m.toLowerCase())
  );

  if (!contieneMarca) return;

  await client.chat.postMessage({
    channel: process.env.CANAL_EQUIPO,
    text: texto
  });

});

receiver.app.listen(process.env.PORT || 3000, () => {
  console.log(`⚡️ Servidor corriendo en puerto ${process.env.PORT}`);
});
