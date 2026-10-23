import http from "node:http";
import https from "node:https";
import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";

// Untrusted page and image URLs must never reach private services or metadata IPs.
function publicAddress(address) {
  try {
    return ipaddr.process(address).range() === "unicast";
  } catch {
    return false;
  }
}

export async function readPublicUrl(
  input,
  { maxBytes, accept, timeout = 7000 },
) {
  const deadline = Date.now() + timeout;
  let url = new URL(input);
  for (let redirects = 0; redirects <= 3; redirects++) {
    if (
      url.href.length > 2048 ||
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password ||
      (url.port && !["80", "443"].includes(url.port))
    )
      throw new Error("Unsupported preview URL");
    const hostname = url.hostname.replace(/^\[|\]$/g, "");
    let timer;
    const addresses = await Promise.race([
      lookup(hostname, { all: true, verbatim: true }),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error("Preview DNS timeout")),
          Math.max(1, deadline - Date.now()),
        );
      }),
    ]).finally(() => clearTimeout(timer));
    if (
      !addresses.length ||
      addresses.some(({ address }) => !publicAddress(address))
    )
      throw new Error("Preview requires a public address");
    const pinned = addresses[0];
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error("Preview timeout");
    const result = await new Promise((resolve, reject) => {
      // Pin the validated DNS result, including across redirects, to prevent rebinding.
      const req = (url.protocol === "https:" ? https : http).request(
        url,
        {
          agent: false,
          autoSelectFamily: false,
          maxHeaderSize: 16384,
          lookup: (_host, options, callback) =>
            options.all
              ? callback(null, [pinned])
              : callback(null, pinned.address, pinned.family),
          headers: {
            "User-Agent": "WiseRoom-LinkPreview/1.0",
            Accept: accept,
            "Accept-Encoding": "identity",
          },
        },
        (res) => {
          res.on("error", reject);
          if (
            [301, 302, 303, 307, 308].includes(res.statusCode) &&
            res.headers.location
          ) {
            resolve({ redirect: res.headers.location });
            res.destroy();
            return;
          }
          const type = (res.headers["content-type"] || "")
            .split(";")[0]
            .trim()
            .toLowerCase();
          if (
            res.statusCode !== 200 ||
            Number(res.headers["content-length"]) > maxBytes ||
            (res.headers["content-encoding"] &&
              res.headers["content-encoding"] !== "identity")
          ) {
            res.destroy(new Error("Preview response unavailable"));
            return;
          }
          const chunks = [];
          let size = 0;
          res.on("data", (chunk) => {
            size += chunk.length;
            if (size > maxBytes)
              res.destroy(new Error("Preview response too large"));
            else chunks.push(chunk);
          });
          res.on("end", () =>
            resolve({ body: Buffer.concat(chunks), type, url: url.href }),
          );
          res.on("aborted", () =>
            reject(new Error("Preview response interrupted")),
          );
        },
      );
      const abort = setTimeout(
        () => req.destroy(new Error("Preview timeout")),
        remaining,
      );
      req.on("error", reject);
      req.on("close", () => clearTimeout(abort));
      req.end();
    });
    if (!result.redirect) return result;
    url = new URL(result.redirect, url);
  }
  throw new Error("Too many preview redirects");
}
