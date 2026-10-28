import { spawnSync } from "node:child_process";
for (const args of [["run", "typecheck"], ["run", "lint"], ["test"]]) {
  const result = spawnSync("npm", args, { stdio: "inherit", env: process.env });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log("ENGINEERING VERIFIED");
