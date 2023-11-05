const { Bot } = require("./lib/ds.js");
const utils = require("./lib/utils.js");
const consts = require("./lib/consts.js");

const { name, version } = require("./package.json");

module.exports = { Bot, utils, consts, "package": { name, version }};
