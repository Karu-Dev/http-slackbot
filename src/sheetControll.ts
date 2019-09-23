const GoogleSpreadsheet = require("google-spreadsheet");
const creds = require("./client_secret.json");
import { promisify } from "util";
import { ChannelObj } from "./types";
const axios = require("axios");
export function parsePlayers(allPlayers: any) {
  let output = "";
  for (let player of allPlayers) {
    if (player.avgGames === 0) {
      output += player.name + "\n";
    } else {
      output += `${player.name} has played an average of ${player.avgGames} per day \n`;
    }
  }
  return output;
}
export async function setAverageGames(channelName: string) {
  await initSpreadsheet(await setChannels());
  const doc = new GoogleSpreadsheet(
    "1jEHlYQvcfziGo78k8R3GQJkRuJ898VzXU-ZoBWs75JQ"
  );
  await promisify(doc.useServiceAccountAuth)(creds);
  const info = await promisify(doc.getInfo)();
  for (let worksheet of info.worksheets) {
    if (worksheet.title === channelName) {
      const rows = await promisify(worksheet.getRows)();
      let allPlayers = [];
      for (let row of rows) {
        const cgId = row.codinggameid;
        if (!cgId) {
          allPlayers.push({
            name:
              row.slackid +
              " has not assigned a Codingame ID, do it with /codelex-coc-register <Codingame ID>",
            avgGames: 0
          });
        }
        const totalGameURL =
          "https://www.codingame.com/services/Leaderboards/getClashLeaderboard";
        const gamePayload = `[1,{"keyword":"${cgId}","active":true,"column":"KEYWORD","filter":"${cgId}"},"ba9e957cd22d7b7ef205c48c19b122e80218443",true,"country",null]`;
        const gamesResponse = await axios.post(
          totalGameURL,
          JSON.parse(gamePayload)
        );
        const notFoundObj = {
          name: `${row.slackid} is not registered on Codingame or hasn't played any public clash of code games`,
          avgGames: 0
        };
        if (gamesResponse.data.users[0]) {
          if (gamesResponse.data.users[0].pseudo === cgId) {
            const dateURL =
              "https://www.codingame.com/services/CodinGamer/findCodingamePointsStatsByHandle";
            const datePayload = `["${gamesResponse.data.users[0].codingamer.publicHandle}"]`;
            const dateResponse = await axios.post(
              dateURL,
              JSON.parse(datePayload)
            );
            const recentDate =
              dateResponse.data.codingamePointsRankingDto.rankHistorics
                .dates[0];
            const currentDate = new Date().getTime();
            const daysSinceReg = Math.ceil(
              (currentDate - recentDate) / 1000 / 60 / 60 / 24
            ); // msToSec/secToMin/minToHr/hrToDay
            const avgGamesPlayed = parseFloat(
              (gamesResponse.data.users[0].clashesCount / daysSinceReg).toFixed(
                2
              )
            );
            row.averagegamesperday = avgGamesPlayed;
            row.save();
            const playerObj = {
              name: row.slackid,
              avgGames: avgGamesPlayed
            };
            allPlayers.push(playerObj);
          } else {
            if (cgId) {
              allPlayers.push(notFoundObj);
            }
          }
        } else {
          if (cgId) {
            allPlayers.push(notFoundObj);
          }
        }
      }
      return allPlayers;
    }
  }
  return null;
}
async function setChannels() {
  let channelsWithUserNames: ChannelObj[] = [];
  const channels = await axios.get(
    "https://slack.com/api/channels.list?token=xoxb-738623637842-751016941524-T0MjktkwIY92ZMUn85L30ED4"
  );
  for (let channel of channels.data.channels) {
    let channelObj: ChannelObj = { name: "", users: [] };
    channelObj.name = channel.name;
    for (let member of channel.members) {
      const getMember = await axios.get(
        `https://slack.com/api/users.info?token=xoxb-738623637842-751016941524-T0MjktkwIY92ZMUn85L30ED4&user=${member}`
      );
      channelObj.users.push(getMember.data.user.name);
    }
    channelsWithUserNames.push(channelObj);
  }
  return channelsWithUserNames;
}
async function initSpreadsheet(channelsWithUserNames: ChannelObj[]) {
  const doc = new GoogleSpreadsheet(
    "1jEHlYQvcfziGo78k8R3GQJkRuJ898VzXU-ZoBWs75JQ"
  );
  await promisify(doc.useServiceAccountAuth)(creds);
  //Creates spreadsheet tabs for missing channels
  const info = await promisify(doc.getInfo)();
  for (let channel of channelsWithUserNames) {
    let makeChannel = true;
    for (let worksheet of info.worksheets) {
      if (channel.name === worksheet.title) {
        makeChannel = false;
        break;
      }
    }
    if (makeChannel && channel.name.match(/\d\d-\d\d\d\d/g)) {
      doc.addWorksheet({
        title: channel.name,
        rowCount: 1000,
        colCount: 26
      });
    }
  }
  //Adding header row to all channels
  const fakeChannel = { name: "fakeChannel", users: ["123", "123"] };
  channelsWithUserNames.unshift(fakeChannel);
  for (let channel of channelsWithUserNames) {
    const infoo = await promisify(doc.getInfo)();
    for (let worksheet of infoo.worksheets) {
      if (worksheet.title === channel.name) {
        await promisify(worksheet.setHeaderRow)([
          "Slack ID",
          "CodingGame ID",
          "Average Games per Day"
        ]);
      }
    }
  }
  //fills spreadsheet tabs with slack usernames
  const inf = await promisify(doc.getInfo)();
  for (let worksheet of inf.worksheets) {
    const rows = await promisify(worksheet.getRows)({
      offset: 1
    });
    for (let channel of channelsWithUserNames) {
      if (channel.name === worksheet.title) {
        for (let user of channel.users) {
          let makeUser = true;
          for (let row of rows) {
            if (user === row.slackid) {
              makeUser = false;
            }
          }
          if (makeUser) {
            await promisify(worksheet.addRow)({
              slackid: user,
              codinggameid: "",
              averagegamesperday: 0
            });
          }
        }
      }
    }
  }
}
