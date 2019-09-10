import express from 'express';
import bodyParser from 'body-parser';
import { routes } from './routes';
import { Server } from 'http';
// Instantiate express
export const app = express();
// Set our port
const port = process.env.PORT || 8000;
// Configure app to user bodyParser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Register our routes in app
app.use('/', routes);


// Start our server
let server: Server;
export const start = () => {
    return new Promise(resolve => {
        server = app.listen(port, () => {
            console.log(`Server started on port ${port}`);
            resolve()
        })
    })
}
export const stop = () => server.close()
if (process.argv[2] === "start"){
    start();
}