import 'dotenv/config';
require('dotenv').config()
import cron from "node-cron";
import express, { Router } from "express";
import bodyParser from "body-parser";
import { getArbitronStatus } from "./logic/setup";
import { startTradingRun } from './logic/trading';

let PORT = 8080;
const app = express();
const router = express.Router();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const tradingTask = cron.schedule(
    "*/2 * * * *",
    async () => await startTradingRun()
);
tradingTask.stop();

router.route("/status").get(async (req, res) => {
    res.send(await getArbitronStatus());
});
router.route("/trade").get(async (req, res) => {
    console.log('Starting trading run');
    res.send(tradingTask.start());
});
router.route("/trade/stop").get((req, res) => {
    console.log('Stopping trading run');
    res.send(tradingTask.stop());
});



app.use("/api", router);
app.listen(PORT);