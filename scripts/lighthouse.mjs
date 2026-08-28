// Lighthouse a besoin d'un Chrome. Plutôt que de dépendre de ce qui traîne sur
// la machine, on pointe systématiquement vers celui que Puppeteer télécharge :
// mêmes scores en local et en CI.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer";

const cheminDeChrome = async () => {
  const chemin = await puppeteer.executablePath();
  return existsSync(chemin) ? chemin : null;
};

let chrome = await cheminDeChrome();

// Le store pnpm réutilise une installation déjà construite sans rejouer le
// script de postinstall : sur une machine neuve, Chrome peut donc manquer.
if (!chrome) {
  console.log("Chrome absent, téléchargement…");
  spawnSync("puppeteer", ["browsers", "install", "chrome"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  chrome = await cheminDeChrome();
}

if (!chrome) {
  console.error("Impossible d'installer le Chrome dont Lighthouse a besoin.");
  process.exit(1);
}

const lhci = spawn("lhci", ["autorun"], {
  stdio: "inherit",
  env: { ...process.env, CHROME_PATH: chrome },
});

lhci.on("exit", (code) => process.exit(code ?? 1));
