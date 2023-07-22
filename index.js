import { Configuration, OpenAIApi } from "openai";
import dotenv from "dotenv";
import Database from "better-sqlite3";
import * as sqlite_vss from "sqlite-vss";
import pMap from "p-map";
dotenv.config();

const openAiConfig = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(openAiConfig);

async function getEmbeddingJsonForText(text) {
    const response = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: text,
    });

    const embedding = response.data.data[0].embedding;

    return JSON.stringify(embedding);
}

function getTimestamp() {
  const now = new Date();
  return now.toISOString();
}

async function main() {
    // thank you chatgpt. beautiful!
    const exampleStrings = [
        "The sun sets gently over the horizon, painting the sky in hues of orange and pink. The warm rays embrace the world, creating a tranquil atmosphere that soothes the soul. As the day bids farewell, the promise of a new dawn whispers hope into the hearts of all who witness this breathtaking spectacle.",
        "In the darkness, fear grips my heart, and I seek solace in the embrace of the night. Shadows dance around me, playing tricks on my imagination, but I find comfort in the stillness of the nocturnal world. With every passing moment, I remind myself that the night will eventually give way to the light, and I'll emerge stronger than before.",
        "Laughter fills the air as children run through the park, carefree and full of joy. Their infectious giggles create a symphony of happiness, lifting the spirits of everyone nearby. In this innocent play, they teach us to find delight in simple pleasures and remind us of the beauty of a life unburdened by worries.",
        "Amidst the chaos, hope shines like a beacon, guiding us through the darkest times. It's the flicker of light that refuses to be extinguished, illuminating the path ahead when all seems lost. Though the world may seem daunting, hope whispers that better days are within reach, and we must keep moving forward.",
        "Lost in thought, memories of the past flood my mind like a river rushing downstream. Each moment, a stepping stone on the journey that brought me here, evokes emotions I thought were long buried. Reflecting on the past, I find wisdom and strength to navigate the challenges of the present.",
        "With determination in her eyes, she faces her fears and takes a leap of faith. Doubts may linger, but the fire within her heart burns brighter, driving her forward into the unknown. She knows that growth lies beyond her comfort zone, and courageously, she embraces the possibilities of the future.",
        "The gentle breeze whispers secrets of distant lands, carrying tales of adventure. It caresses the skin like a gentle touch, inviting us to wander and explore the world around us. In its whispers, we find inspiration to embark on our own journeys of discovery.",
        "Hearts connect, transcending borders and languages, in the universal language of love. Love knows no boundaries, and its warmth can be felt across oceans and mountains alike. In its embrace, we find solace, belonging, and the power to heal even the deepest wounds.",
        "Anxiety tightens its grip, suffocating every breath, as uncertainty looms overhead. The weight of what-ifs and maybes crushes the spirit, and the world becomes a labyrinth of worries. In this darkness, we must remember that seeking support and talking openly can lift the burden and pave the way for hope.",
        "The scent of fresh rain on dry earth awakens a sense of nostalgia and renewal. Nature dances with delight as the parched ground welcomes the life-giving drops. With each raindrop, there is a promise of growth and new beginnings, a reminder that life is an eternal cycle of change and rebirth.",
        "In the vastness of space, stars twinkle like diamonds, reminding us of our place in the cosmos. Amidst the boundless darkness, we find the brilliance of celestial bodies, each with its own story to tell. Gazing at the stars, we're filled with wonder and a yearning to explore the mysteries of the universe.",
        "Bitterness and resentment brew, like a storm gathering strength before it breaks. Hurt and disappointment intertwine, forming a tempest of emotions that threaten to consume us. To find peace, we must learn to let go of the storm's power and embrace forgiveness and understanding.",
        "A melody weaves its way through the air, evoking emotions words cannot express. Music speaks to the depths of our souls, conveying joy, sorrow, and everything in between. It connects us, transcending language and culture, and allows us to experience emotions beyond the confines of mere words.",
        "Whispers of the forest echo, as ancient trees stand tall, witnessing the passage of time. Nature's cathedral envelopes us in serenity, and the wisdom of the woods reminds us of the cyclical nature of life. Among the trees, we find a sanctuary where we can reconnect with our roots and rediscover ourselves.",
        "In the hustle and bustle of the city, dreams collide and aspirations take flight. Each street corner becomes a crossroad of possibilities, and ambition fuels the constant motion. In this urban symphony, dreams converge, and the city becomes a canvas for those daring enough to paint their destinies.",
        "Silent tears fall, unnoticed, carrying the weight of unspoken emotions. Behind smiles and laughter, there lies a tapestry of feelings, often hidden from the world. These tears are a reminder that vulnerability is not weakness; it is a testament to our capacity to feel deeply and authentically.",
        "The aroma of freshly brewed coffee envelops the senses, awakening the mind. In the first sip, we find a moment of tranquility, a pause from the chaos of life. Coffee is a ritual that offers comfort, companionship, and the promise of a new day filled with possibilities.",
        "Amidst the ruins, the spirit of resilience rises, rebuilding from the ashes. When all seems lost, the human spirit prevails, finding strength in the face of adversity. We rebuild, not just our physical surroundings, but also the foundations of hope and determination that reside within us.",
        "A solitary figure stands on the edge of a cliff, contemplating life's infinite possibilities. The world stretches out before them, vast and full of unknowns. In this moment of reflection, they find courage to embrace the uncertainties and step boldly into the uncharted territories of their journey.",
        "With courage in her heart, she faces adversity head-on, refusing to back down. In the crucible of challenges, she forges her character, becoming a force to be reckoned with. Her resilience is a testament to the power of human will and a beacon of inspiration for all who witness her strength."
      ];

    
    const databaseName = `database-${getTimestamp()}.db`

    const db = new Database(databaseName, { verbose: console.log })
    sqlite_vss.load(db);

    // create new table
    const createTableSql = `CREATE TABLE IF NOT EXISTS quotes
        (id INTEGER PRIMARY KEY,
         text TEXT,
         text_embedding BLOB
        )`
    const createTableStatement = db.prepare(createTableSql)
    createTableStatement.run()

    const createVirtualTableSql = `CREATE VIRTUAL TABLE vss_quotes USING vss0(
        text_embedding(1536)
    )`

    const createVirtualTableStatement = db.prepare(createVirtualTableSql)
    createVirtualTableStatement.run()


    const insertRowsSql = `INSERT INTO quotes (
        text, text_embedding) VALUES (?, ?)`
    const insertRowsStatement = db.prepare(insertRowsSql)

    await pMap(exampleStrings, async (text) => {
        const textEmbeddingJson = await getEmbeddingJsonForText(text)
        insertRowsStatement.run(text, textEmbeddingJson)
    }, { concurrency: 5 })

    const insertIntoVirtualTableSql = `
insert into vss_quotes(rowid, text_embedding)
  select id, text_embedding from quotes;
`

    const insertIntoVirtualTableStatement = db.prepare(insertIntoVirtualTableSql);

    insertIntoVirtualTableStatement.run();

    const searchQuery = 'music';
    const searchQueryEmbeddingJson = await getEmbeddingJsonForText(searchQuery)

    const searchSql = `
    with matches as (
        select 
          rowid, 
          distance
        from vss_quotes
        where vss_search(
          text_embedding,
          ?
        )
        limit 20
      )
      select
        quotes.id,
        quotes.text,
        matches.distance
      from matches
      left join quotes on quotes.id = matches.rowid
    `

    const searchStatement = db.prepare(searchSql)

    const searchResults = searchStatement.all(searchQueryEmbeddingJson)
    console.log(searchResults)
}

main()
