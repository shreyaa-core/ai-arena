import { bn } from "./bn.js";
import { en } from "./en.js";
import { hi } from "./hi.js";

const PACKS = { en, bn, hi };

export function getTranslations(lang = "en") {
  return PACKS[lang] || en;
}
