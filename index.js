const { Client } = require("discord.js-selfbot-v13");
const { Manager } = require("erela.js");
const Spotify = require("erela.js-spotify");

const config = {
    token: "YourAccountToken",
    nodes: [
        {
            host: "lava-all.ajieblogs.eu.org",                    // }
            port: 80,                                            //    }  This is a valid lavalink! no need to change this
            password: "https://dsc.gg/ajidevserver",            //     }
            secure: false                                      //    }
        }
    ],
    spotify: {
        clientID: "spotifyClientId",
        clientSecret: "spotifyClientSecret"
    }
};

const client = new Client();

client.manager = new Manager({
    nodes: config.nodes,
    plugins: [new Spotify(config.spotify)],
    send(id, payload) {
        const guild = client.guilds.cache.get(id);
        if (guild) guild.shard.send(payload);
    }
});

client.manager.on("nodeConnect", (node) => {
    console.log(`✅ Connected to Lavalink node: ${node.options.identifier}`);
});

client.manager.on("nodeError", (node, error) => {
    console.error(`❌ Error connecting to node ${node.options.identifier}:`, error);
});

client.manager.on("nodeDisconnect", (node) => {
    console.warn(`⚠️ Disconnected from Lavalink node: ${node.options.identifier}`);
});

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    client.manager.init(client.user.id);
});

client.on("raw", (d) => client.manager.updateVoiceState(d));

client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild) return;
    if (message.author.id !== "915158686723358720") return;
    
    const args = message.content.split(" ");
    const command = args.shift().toLowerCase();
    
    if (command === "!play") {
        if (!args[0]) return message.channel.send("Please provide a Spotify song or playlist URL.");
        
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.channel.send("You need to be in a voice channel!");
        
        const player = client.manager.create({
            guild: message.guild.id,
            voiceChannel: voiceChannel.id,
            textChannel: message.channel.id
        });
        
        if (player.state !== "CONNECTED") player.connect();
        
        const search = await client.manager.search(args.join(" "), message.author);
        if (search.loadType === "NO_MATCHES") return message.channel.send("No results found.");
        
        player.queue.add(search.tracks[0]);
        message.channel.send(`Added to queue: ${search.tracks[0].title}`);
        
        if (!player.playing) player.play();
    }

    if (command === "!skip") {
        const player = client.manager.players.get(message.guild.id);
        if (!player) return message.channel.send("No music playing.");
        player.stop();
        message.channel.send("Skipped song.");
    }

    if (command === "!stop") {
        const player = client.manager.players.get(message.guild.id);
        if (!player) return message.channel.send("No music playing.");
        player.destroy();
        message.channel.send("Stopped music and left voice channel.");
    }

    if (command === "!queue") {
        const player = client.manager.players.get(message.guild.id);
        if (!player || !player.queue.length) return message.channel.send("Queue is empty.");
        
        let queueMsg = "Current queue:\n";
        player.queue.forEach((track, index) => {
            queueMsg += `${index + 1}. ${track.title}\n`;
        });
        message.channel.send(queueMsg);
    }
});

client.login(config.token);
