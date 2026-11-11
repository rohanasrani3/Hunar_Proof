import { cookies } from "next/headers";
export async function language() {
  const hi = (await cookies()).get("kareghar-language")?.value === "hi";
  return {
    lang: hi ? ("hi" as const) : ("en" as const),
    t: (en: string, hindi: string) => (hi ? hindi : en),
  };
}
