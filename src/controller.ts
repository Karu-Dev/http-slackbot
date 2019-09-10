import { Request, Response } from "express";
import { setAverageGames,parsePlayers } from "./sheetControll";
const axios = require("axios");
export class Controller {
  static async slackCall(req: Request, res: Response) {
    res.json({ response_type: "in_channel", text: "Calculating..." });
    if (req.body.text.match(/\d\d-\d\d\d\d/g)) {
      const allPlayers = await setAverageGames(req.body.text);
      if (allPlayers) {
        const slackText = parsePlayers(allPlayers);
        const slackSay = { response_type: "in_channel", text: slackText };
        const options = {
          method: "POST",
          headers: { "content-type": "application/json" },
          data: slackSay,
          url: req.body.response_url
        };
        axios(options);
      }
    }
  }
}
