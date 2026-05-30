// Browser.js
const Signer = require("./index");

var url = process.argv[2];
var userAgent = process.argv[3];
var timeoutMs = Number(process.env.TIKTOK_SIGNATURE_TIMEOUT_SECONDS || 60) * 1000;

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`TikTok signature generator timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

(async function main() {
  let signer;
  async function signRequest() {
    signer = new Signer(url, userAgent);
    await signer.init();

    const sign = await signer.sign(url);
    const navigator = await signer.navigator();

    let output = JSON.stringify({
      status: "ok",
      data: {
        ...sign,
        navigator: navigator,
      },
    });
    console.log(output);
  }

  try {
    await withTimeout(signRequest(), timeoutMs);
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  } finally {
    if (signer) {
      try {
        await signer.close();
      } catch (closeErr) {
        console.error(closeErr && closeErr.stack ? closeErr.stack : closeErr);
        process.exitCode = 1;
      }
    }
  }
})();
