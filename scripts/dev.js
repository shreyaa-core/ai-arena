import { spawn } from "node:child_process";

const isWin = process.platform === "win32";
const npmCmd = isWin ? "npm.cmd" : "npm";

function launch(name, args) {
  const child = spawn(npmCmd, args, {
    stdio: "inherit",
    shell: isWin,
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

const serverProc = launch("server", ["--prefix", "server", "run", "dev"]);
const clientProc = launch("client", ["--prefix", "client", "run", "dev"]);

function shutdown() {
  serverProc.kill();
  clientProc.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
