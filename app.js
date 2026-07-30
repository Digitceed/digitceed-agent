// Plesk/Passenger entry point for this Next.js app. Passenger requires this
// file directly and expects it to start listening on process.env.PORT — see
// node_modules/next/dist/docs/01-app/02-guides/custom-server.md.
// Not used for local dev (use `npm run dev`) or `next start` directly.
const { createServer } = require("http");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log(`> Ready on port ${port}`);
  });
});
