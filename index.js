require('dotenv').config();

const discord = require("discord.js");
const https = require("https");

const config = extend(require("./config.json"), {
  "BOT_TOKEN": process.env.BOT_TOKEN,
  "CHANNEL_ID": process.env.CHANNEL_ID,
  "G_PORTAL_ID": process.env.G_PORTAL_ID
});

const text = require("./lang/" + config.LANG + ".json");

const client = new discord.Client();

var lastServerInfo;

function extend (obj1, obj2) {
  var result = obj1, val;
  for (val in obj2) {
    if (obj2.hasOwnProperty(val) && obj2[val] !== undefined) {
      result[val] = obj2[val];
    }
  }
  return result;
}

function sendMessage(message) {
  const channel = client.channels.cache.get(config.CHANNEL_ID);
  channel.send(message);
}

function playerCountChanged(oldCount, newCount) {
  if(oldCount < newCount) {
    sendMessage(`${text.PLAYER_CAME_ONLINE} (${newCount}/${lastServerInfo.maxPlayers}) ${text.VIKINGS_ONLINE}!`);
  }
  else if (oldCount > newCount){
    sendMessage(`${text.PLAYER_WENT_OFFLINE} (${newCount}/${lastServerInfo.maxPlayers}) ${text.VIKINGS_ONLINE}!`);
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
  https.get("https://api.g-portal.com/gameserver/query/" + config.G_PORTAL_ID, function(res){
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
