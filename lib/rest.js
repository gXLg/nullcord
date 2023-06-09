const https = require("https");
const { mimes } = require("gxlg-utils");
const fs = require("fs");

// rest api request maker
// since will use this for discord,
// can simplify and use the same base url all the time
class Rest {

  limit = { };
  lock = { };
  globalRate = 0;

  constructor(url, headers){
    const urlObject = new URL(url);
    this.hostname = urlObject.hostname;
    this.path = urlObject.pathname;
    headers["Content-Type"] = "application/json";
    this.headers = headers;
  }

  async request(options, scopePath, body){

    const limit = this.limit;
    const scope = options.method.toUpperCase() + "#" + scopePath;
    const lock = this.lock[scope] ?? null;
    const rest = this;

    async function doRequest(resolve, reject){

      await lock;
      // ratelimit handling
      let oldBucket = null;
      for(const bucket in limit){
        if(limit[bucket].scopes.has(scope)){
          oldBucket = bucket;
          if(limit[bucket].remaining == 0){
            await new Promise(
              r => setTimeout(r,
                limit[bucket].reset * 1000 - Date.now() + 1000
              )
            );
          }
          break;
        }
      }

      // wait for global
      if(rest.globalRate >= 50)
        await new Promise(res => {
          const i = setInterval(() => {
            if(rest.globalRate < 50){
              clearInterval(i);
              res();
            }
          }, 100);
        });

      const req = https.request(options, res => {

        const buffer = [];
        res.on("data", data => buffer.push(data));
        res.on("end", async () => {

          function setRateLimit(){
            const bucket = res.headers["x-ratelimit-bucket"];
            if(oldBucket != null && oldBucket != bucket)
              limit[oldBucket].scopes.delete(scope);
            if(bucket in limit){
              limit[bucket].scopes.add(scope);
            } else {
              limit[bucket] = {
                "scopes": new Set([scope]),
              };
            }
            limit[bucket].remaining = parseInt(
              res.headers["x-ratelimit-remaining"]
            );
            limit[bucket].reset = parseInt(
              res.headers["x-ratelimit-reset"]
            );
          }

          rest.globalRate ++;
          setTimeout(() => { rest.globalRate --; }, 1000);

          // if was rate-limited
          if("retry-after" in res.headers){
            let retry;
            if(res.headers["x-ratelimit-scope"] == "global")
              retry = 1;
            else {
              setRateLimit();
              retry = parseFloat(res.headers["retry-after"]);
            }
            await new Promise(
              r => setTimeout(async () => {
                await doRequest(resolve, reject);
                r();
              }, retry * 1000)
            );
            return;
          }

          // ratelimit setup
          if("x-ratelimit-bucket" in res.headers)
            setRateLimit();

          const data = buffer.join("");
          if(data == "") resolve({ });
          else resolve(JSON.parse(data));
        });
      })

      req.on("error", error => {
        reject(error);
      });

      if(body)
        for(const part of body)
          req.write(part);
      req.end();

    }
    this.lock[scope] = new Promise(doRequest);
    return this.lock[scope];
  }

  async post(path, scope, jsonBody, files){
    if(files) return this.postMultipart(path, scope, jsonBody, files);
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "POST",
      "headers": this.headers
    };
    return this.request(options, scope, [JSON.stringify(jsonBody)]);
  }

  async patch(path, scope, jsonBody, files){
    if(files) return this.patchMultipart(path, scope, jsonBody, files);
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "PATCH",
      "headers": this.headers
    };
    return this.request(options, scope, [JSON.stringify(jsonBody)]);
  }

  async put(path, scope){
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "PUT",
      "headers": this.headers
    };
    return this.request(options, scope);
  }

  async get(path, scope){
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "GET",
      "headers": this.headers
    };
    return this.request(options, scope);
  }

  async del(path, scope){
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "DELETE",
      "headers": this.headers
    };
    return this.request(options, scope);
  }

  async postMultipart(path, scope, jsonBody, files){
    const headers = {};
    for(let header in this.headers)
      headers[header] = this.headers[header];

    const body = [
      "Content-Disposition: form-data; " +
        "name=\"payload_json\"",
      "Content-Type: application/json",
      "",
      JSON.stringify(jsonBody)
    ].join("\n");

    const uploads = [];
    let index = 0;
    for(const filename in files){

      const parts = filename.split(".");
      const type = parts[parts.length - 1];
      const mime = mimes[type] ?? "application/octet-stream";

      const data = [
        "Content-Disposition: form-data; " +
          "name=\"files[" + index + "]\"; " +
          "filename=\"" + filename + "\"",
        "Content-Type: " + mime,
        "",
        files[filename]
      ].join("\n");

      uploads.push(data);

      index ++;
    }

    const alpha = "0123456789abcdef";
    const text = [body, ...uploads].join("");

    function bound(b){
      const c = b ?? "";
      for(const d of alpha)
        if(!text.includes(c + d))
          return (c + d);
      for(const d of alpha){
        const r = bound(d + c);
        if(r) return r;
      }
      return false;
    }

    const boundary = bound();

    headers["Content-Type"] = "multipart/form-data; boundary=\"" + boundary + "\"";
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "POST",
      "headers": headers
    };

    return this.request(options, scope, [
      "--" + boundary + "\n" + body + "\r\n--" + boundary + "\n",
      Buffer.from(uploads.join("\r\n--" + boundary + "\n"), "binary"),
      "\r\n--" + boundary + "--"
    ]);
  }

  async patchMultipart(path, scope, jsonBody, files){
    const headers = {};
    for(let header in this.headers)
      headers[header] = this.headers[header];

    const body = [
      "Content-Disposition: form-data; " +
        "name=\"payload_json\"",
      "Content-Type: application/json",
      "",
      JSON.stringify(jsonBody)
    ].join("\n");

    const uploads = [];
    let index = 0;
    for(const filename in files){

      const parts = filename.split(".");
      const type = parts[parts.length - 1];
      const mime = mimes[type] ?? "application/octet-stream";

      const data = [
        "Content-Disposition: form-data; " +
          "name=\"files[" + index + "]\"; " +
          "filename=\"" + filename + "\"",
        "Content-Type: " + mime,
        "",
        files[filename]
      ].join("\n");

      uploads.push(data);

      index ++;
    }

    const alpha = "0123456789abcdef";
    const text = [body, ...uploads].join("");

    function bound(b){
      const c = b ?? "";
      for(const d of alpha)
        if(!text.includes(c + d))
          return (c + d);
      for(const d of alpha){
        const r = bound(d + c);
        if(r) return r;
      }
      return false;
    }

    const boundary = bound();

    headers["Content-Type"] = "multipart/form-data; boundary=\"" + boundary + "\"";
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": "PATCH",
      "headers": headers
    };

    return this.request(options, scope, [
      "--" + boundary + "\n" + body + "\r\n--" + boundary + "\n",
      Buffer.from(uploads.join("\r\n--" + boundary + "\n"), "binary"),
      "\r\n--" + boundary + "--"
    ]);
  }

}

module.exports = Rest;
