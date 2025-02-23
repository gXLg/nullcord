const fs = require("fs");

const events = fs.readFileSync("./events.txt", "utf8");
const events2 = fs.readFileSync("./events2.txt", "utf8");

const i = events.trim().split("\n\n");
const dep = { };
for (const n of i) {
  const [m, ...d] = n.split("\n");
  const name = m.split(" ")[0];
  for (const e of d) {
    const event = e.trim().split(" ")[1];
    if (event in dep) dep[event].push(name);
    else {
      dep[event] = [name];
    }
  }
}

const a = events2.trim().slice(11, -13).split("</tr><tr>");
const e = [];
for (const r of a) {
  const l = r.split("</a>")[0];
  const name = l.split("\">")[1];
  if (["Hello", "Resumed", "Reconnect", "Invalid Session"].includes(name)) continue;
  const par = name.split(" ").join("_").toUpperCase();
  e.push(par);
}

fs.writeFileSync("./dependencies.json", JSON.stringify(dep));
fs.writeFileSync("./events.json", JSON.stringify(e));
