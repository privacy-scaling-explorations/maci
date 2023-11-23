const path = require("path");
const shelljs = require("shelljs");
const logger = require("./logger").logger;
const db = require("./db");
const { whitelist } = require("utils");

const cliPath = path.join(__dirname, "..", "cli");

const cliCmd = `cd ${cliPath} && node build/index.js`;

async function handler(req, res, dbClient) {
    let output, cmd, query, dbres;
    let silent = true;
    switch (req.body["method"]) {
        case "signup":
            if (
                !("pubkey" in req.body && req.body["pubkey"]) ||
                !("maci" in req.body && req.body["maci"])
            ) {
                res.send("missing parameters...");
                break;
            }

            const pubKey = req.body["pubkey"];
            const maci = req.body["maci"];

            if (!whitelist(pubKey) || !whitelist(maci)) break;

            query = { MACI: req.body["maci"] };
            dbres = await dbClient
                .db(db.dbName)
                .collection(db.collectionName)
                .findOne(query);
            if (!dbres) {
                res.send(`MACI contract address ${req.body["maci"]} not exist`);
                break;
            }

            cmd = `${cliCmd} signup -p ${pubKey} -x ${maci}`;
            logger.debug(`process signup...${cmd}`);
            output = shelljs.exec(cmd, { silent });
            break;
        case "genkey":
            cmd = `${cliCmd} genMaciKeypair`;
            logger.debug(`process genkey...${cmd}`);
            output = shelljs.exec(cmd, { silent });
            break;
        case "publish":
            if (
                !("pubkey" in req.body && req.body["pubkey"]) ||
                !("maci" in req.body && req.body["maci"])
            ) {
                res.send("missing parameters...");
                break;
            }

            if (
                !whitelist(req.body["pubKey"]) ||
                !whitelist(req.body["maci"]) ||
                !whitelist(req.body["privKey"]) ||
                !whitelist(req.body["state_index"]) ||
                !whitelist(req.body["vote_option_index"]) ||
                !whitelist(req.body["new_vote_weight"]) ||
                !whitelist(req.body["nonce"]) ||
                !whitelist(req.body["poll_id"])
            )
                break;

            query = { MACI: req.body["maci"] };
            dbres = await dbClient
                .db(db.dbName)
                .collection(db.collectionName)
                .findOne(query);
            if (!dbres) {
                res.send(`MACI contract address ${req.body["maci"]} not exist`);
                break;
            }

            cmd = `${cliCmd} publish -p ${req.body["pubkey"]} -x ${req.body["maci"]} -sk ${req.body["privkey"]} -i ${req.body["state_index"]} -v ${req.body["vote_option_index"]} -w ${req.body["new_vote_weight"]} -n ${req.body["nonce"]} -o ${req.body["poll_id"]}`;
            if (req.body["salt"]) {
                cmd += ` -s ${req.body["salt"]}`;
            }
            logger.debug(`publishMessage...${cmd}`);
            output = shelljs.exec(cmd, { silent });
            break;
        case "verify":
            if (
                !("maci" in req.body && req.body["maci"]) ||
                !("poll_id" in req.body && req.body["poll_id"])
            ) {
                res.send("missing parameters...");
                break;
            }

            if (!whitelist(req.body["maci"]) || !whitelist(req.body["poll_id"]))
                break;

            query = { MACI: req.body["maci"] };
            dbres = await dbClient
                .db(db.dbName)
                .collection(db.collectionName)
                .findOne(query);
            if (!dbres) {
                res.send(`MACI contract address ${req.body["maci"]} not exist`);
                break;
            }
            const pptKey = "PollProcessorAndTally-" + req.body["poll_id"];
            if (!(pptKey in dbres)) {
                res.send(
                    `PollProcessAndTally contract for poll ${req.body["poll_id"]} not exists`,
                );
                break;
            }
            pptAddr = dbres[pptKey];
            cmd = `${cliCmd} verify -t ${req.body["tally_file"]} -x ${req.body["maci"]} -o ${req.body["poll_id"]} -q ${pptAddr}`;
            output = shelljs.exec(cmd, { silent });
            break;
        default:
            res.send("unknown method...");
    }
    if (!output) {
        return;
    } else if (output.stderr) {
        res.send(`${req.body.method} failed with error: ${output.stderr}`);
    } else {
        res.send(`${output}`);
    }
}

module.exports = handler;
