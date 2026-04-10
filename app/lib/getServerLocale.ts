import { cookies } from "next/headers";

import { LOCALE_COOKIE_NAME } from "./localeConstants";
import type { Locale } from "./siteCopy";

export async function getServerLocale(): Promise<Locale> {
  const jar = await cookies();
  const v = jar.get(LOCALE_COOKIE_NAME)?.value;
  return v === "ja" ? "ja" : "en";
}
