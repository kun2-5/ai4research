import path from "path";
import fs from "fs";

const candidates = [
  process.env.WIKI_DATA_PATH,
  path.resolve(process.cwd(), "../wiki-data"),
  path.resolve(process.cwd(), "wiki-data"),
];

export const WIKI_DATA_PATH =
  candidates.find((p) => p && fs.existsSync(p)) ?? candidates[1]!;
