const fs = require("fs");
const { execSync } = require("child_process");

const envFile = fs.readFileSync(".env", "utf8");
const lines = envFile.split("\n");

const TARGET_KEYS = ["DATABASE_URL", "DATABASE_TOKEN", "TURSO_AUTH_TOKEN", "DATABASE_AUTH_TOKEN"];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  console.log(`Found key: ${key}`);
  if (TARGET_KEYS.includes(key) || key.includes("TOKEN") || key.includes("AUTH") || key.includes("URL")) {
    console.log(`  -> Setting ${key} in Vercel...`);
    execSync(`vercel env add ${key} production --force`, {
      input: val,
      stdio: ["pipe", "inherit", "inherit"],
    });
    console.log(`  -> Done.`);
  }
}
console.log("All done.");
