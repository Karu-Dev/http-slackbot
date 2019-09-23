# Bot for Slack  
Bot is based on ExpressJs to handle incoming POST requests from slack API.  
The bot works by integrating google spreadsheets as it's database and sending HTTP requests to codingame to retrieve the player's total game count as well as the timestamp of their first game played.  
**On channel join**  
On joining the channel the bot reads every user in the channel and adds them to a google spreadsheet that's used as a database.  
**Available commands**  
/codelex-clash-of-code [channelName] - Returns a list of every user in the channel and their average games played in a day.  
**Unimplemented commands**  
/codelex-clash-of-code-register [codingameUsername] - Should assign a CodinGame username to a slack username.  
/codelex-clash-of-code-update - Should update every channel and user in the google spreadsheet with new info.  
