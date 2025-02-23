const https = require("https");
const { mimes } = require("gxlg-utils");
const fs = require("fs");

// rest api request maker
// since will use this for discord,
// can simplify and use the same base url all the time
class Rest {

  scopeToBucket = { };
  buckets = { };
  globalRate = 0;
  globalReset = 0;

  constructor(url, headers, retry){
    const urlObject = new URL(url);
    this.hostname = urlObject.hostname;
    this.path = urlObject.pathname;
    headers["Content-Type"] = "application/json";
    const { name, version } = require("..").package;
    headers["User-Agent"] = "DiscordBot (" + name + ", " + version + "); Originally by /dev/null";
    this.headers = headers;
    this.retry = retry;
  }

  async wrequest(options, scopePath, body){
    while (true) {
      const { success, data } = await this.xrequest(options, scopePath, body);
      if (success || !this.retry) return data;
    }
  }

  async xrequest(options, scopePath, body){
    const scope = options.method.toUpperCase() + "#" + (scopePath ?? "global");
    const bucketId = this.scopeToBucket[scope];
    let bucket = null;
    let lock = null;
    const rest = this;

    if (bucketId != null) {
      bucket = this.buckets[bucketId];
      lock = bucket.lock;
      bucket.lock = new Promise(r => doRequest(r));
      return bucket.lock;
    } else {
      return new Promise(r => doRequest(r));
    }

    async function doRequest(resolve){
      try { await lock; } catch { }

      // TODO: remove
      //console.error("request:", scope);

      // global cooldown
      while (rest.globalReset > Date.now()) {
        await new Promise(r => setTimeout(r, rest.globalReset - Date.now()));
      }

      // bucket cooldown
      if (bucket != null && bucket.remaining == 0) {
        await new Promise(r => setTimeout(r, bucket.reset - Date.now()));
      }

      // global ratelimit
      while (rest.globalRate >= 50) {
        await new Promise(res => {
          const i = setInterval(() => {
            if (rest.globalRate < 50) {
              clearInterval(i);
              res();
            }
          }, 100);
        });
      }

      // TODO: remove
      //console.error("executing");

      const req = https.request(options, res => {

        const buffer = [];
        res.on("data", data => buffer.push(data));
        res.on("end", async () => {

          const data = buffer.join("");

          rest.globalRate ++;
          setTimeout(() => { rest.globalRate --; }, 1000);

          // received data about current request bucket, update cache
          if ("x-ratelimit-bucket" in res.headers) {
            const newBucketId = res.headers["x-ratelimit-bucket"];
            rest.scopeToBucket[scope] = newBucketId;
            if (!(newBucketId in rest.buckets)) {
              rest.buckets[newBucketId] = { };
            }
            bucket = rest.buckets[newBucketId];
            bucket.remaining = parseInt(res.headers["x-ratelimit-remaining"]);
            bucket.limit = parseInt(res.headers["x-ratelimit-limit"]);

            // TODO: remove
            //console.error("bucket id:", newBucketId, "remaining:", bucket.remaining);

            const reset = Date.now() + 1000 * parseFloat(res.headers["x-ratelimit-reset-after"]);
            if (bucket.reset == null || bucket.reset < reset) {
              bucket.reset = reset;
            }
          }

          if (res.statusCode == 429) {
            // actually got rate-limited

            // TODO: remove
            //console.error("| rate limit occured");
            //console.error("| msg:", JSON.parse(data));
            //console.error("| bucket id:", res.headers["x-ratelimit-bucket"]);
            //console.error("| bucket:", bucket);
            //console.error("| retry-after header:", res.headers["retry-after"]);

            const reset = Date.now() + 1000 * parseFloat(res.headers["retry-after"]);

            if ("x-ratelimit-global" in res.headers) {
              rest.globalReset = reset;
            } else {
              bucket.reset = reset;
            }

            resolve({ "success": false, "data": {
              "code": -1, "errors": {
                "ratelimit": [JSON.parse(data)]
              }
            } });

          } else if (res.statusCode == 204) {
            resolve({ "success": true, "data": { } });

          } else if (res.statusCode >= 500) {
            resolve({ "success": false, "data": {
              "code": -1, "errors": { "internal": [data] }
            } });

          } else {
            if (data == "") resolve({ "success": true, "data": { } });
            else resolve({ "success": true, "data": JSON.parse(data) });

          }
        });
      });

      req.on("error", error => {
        resolve({ "success": false, "data": {
          "code": -1, "errors": { "internal": [error] }
        } });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({ "success": false, "data": {
          "code": -1, "errors": { "timeout": [true] }
        } });
      });

      for (const part of body ?? []) req.write(part);
      req.end();
    }
  }

  async request(path, scope, method, jsonBody, files) {
    if (files) return this.multiple(path, scope, method, jsonBody, files);

    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": method,
      "headers": this.headers,
      "timeout": 10000
    };
    const body = jsonBody ? [JSON.stringify(jsonBody)] : null;
    return this.wrequest(options, scope, body);
  }

  async multiple(path, scope, method, jsonBody, files) {
    const headers = { };
    for (let header in this.headers) {
      headers[header] = this.headers[header];
    }

    const body = [
      "Content-Disposition: form-data; " +
        "name=\"payload_json\"",
      "Content-Type: application/json",
      "",
      JSON.stringify(jsonBody)
    ].join("\n");

    const uploads = [];
    let index = 0;
    for (const filename in files) {

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
      for (const d of alpha) {
        if (!text.includes(c + d)) return (c + d);
      }
      for (const d of alpha) {
        const r = bound(d + c);
        if (r) return r;
      }
      return false;
    }

    const boundary = bound();

    headers["Content-Type"] = "multipart/form-data; boundary=\"" + boundary + "\"";
    const options = {
      "hostname": this.hostname,
      "path": this.path + path,
      "method": method,
      "headers": headers,
      "timeout": 10000
    };

    return this.wrequest(options, scope, [
      "--" + boundary + "\n" + body + "\r\n--" + boundary + "\n",
      Buffer.from(uploads.join("\r\n--" + boundary + "\n"), "binary"),
      "\r\n--" + boundary + "--"
    ]);
  }

  async post(path, scope, jsonBody, files) {
    return this.request(path, scope, "POST", jsonBody, files);
  }
  async patch(path, scope, jsonBody, files){
    return this.request(path, scope, "PATCH", jsonBody, files);
  }
  async put(path, scope){
    return this.request(path, scope, "PUT");
  }
  async get(path, scope){
    return this.request(path, scope, "GET");
  }
  async del(path, scope){
    return this.request(path, scope, "DELETE");
  }
}

module.exports = Rest;
