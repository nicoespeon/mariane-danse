// Lighthouse a besoin d'un Chrome. Plutôt que de dépendre de ce qui traîne sur
// la machine, on pointe systématiquement vers celui que Puppeteer télécharge :
// mêmes scores en local et en CI.
import { spawn } from "node:child_process";
import puppeteer from "puppeteer";

const chrome = await puppeteer.executablePath();

const lhci = spawn("lhci", ["autorun"], {
  stdio: "inherit",
  env: { ...process.env, CHROME_PATH: chrome },
});

lhci.on("exit", (code) => process.exit(code ?? 1));
