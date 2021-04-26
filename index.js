const discord = require("discord.js");
const https = require("https");

const config = require("./config.json");
const text = require("./lang/" + config.LANG + ".json")

const client = new discord.Client();

var lastServerInfo;

function sendMessage(message) {
  const channel = client.channels.cache.get(config.CHANNEL_ID);
  channel.send(message);
}

function playerCountChanged(oldCount, newCount) {
  if(oldCount < newCount) {
    sendMessage(`${text.PLAYER_CAME_ONLINE} (${newCount}/${serverInfo.maxPlayers}) ${text.VIKINGS_ONLINE}!`);
  }
  else if (lastServerInfo.currentPlayers > serverInfo.currentPlayers){
    sendMessage(`${text.PLAYER_WENT_OFFLINE} (${newCount}/${serverInfo.maxPlayers}) ${text.VIKINGS_ONLINE}!`);
  }
}

function serverStatusChanged(oldStatus, newStatus) {
  if(newStatus) {
    sendMessage(text.SERVER_CAME_ONLINE);
  }
  else {
    sendMessage(text.SERVER_WENT_OFFLINE);
  }
}

function updateServerInfo(serverInfo) {
  if (serverInfo == undefined) return;
  if (lastServerInfo != undefined) {
    if(lastServerInfo.currentPlayers != serverInfo.currentPlayers) {
      playerCountChanged(lastServerInfo.currentPlayers, serverInfo.currentPlayers);
    }

    if (lastServerInfo.online != serverInfo.online) {
      serverStatusChanged(lastServerInfo.online, serverInfo.online);
    }
  }
  lastServerInfo = serverInfo
}

function readServerData() {
  https.get(config.G_PORTAL_URL, function(res){
      res.on("data", data => {
        var response = JSON.parse(data);
        updateServerInfo(response);
      });
  }).on("error", function(e){
        console.log("Got an error reading server info: ", e);
  });
}

setInterval(readServerData, config.REFRESH);

function commandWednesday(message, args) {
  message.reply(text.ITS_WEDNESDAY);
}

function commandPlayersOnline(message, args) {
  if (lastServerInfo == undefined) return;
  message.reply(`${lastServerInfo.currentPlayers}/${lastServerInfo.maxPlayers} ${text.VIKINGS_ONLINE}!`);
}

client.on("message", function(message) {
  if (message.author.bot) return;
  if (!message.content.startsWith(config.COMMAND_PREFIX)) return;

  const commandBody = message.content.slice(config.COMMAND_PREFIX.length);
  const args = commandBody.split(" ");
  const command = args.shift().toLowerCase();

  if (command === text.WEDNESDAY + "?") {
    commandWednesday(message, args);
  }
  else if (command === "online") {
    commandPlayersOnline(message, args);
  }
});

client.login(config.BOT_TOKEN);