import { NextResponse } from "next/server";

import { getNow, type NowResponse } from "../../lib/now";

// セグメント設定は静的解析されるため、定数の import ではなくリテラルで書く
export const revalidate = 600;

export async function GET() {
  const now = await getNow();
  return NextResponse.json<NowResponse>(now, {
    status: now.status === "error" ? 502 : 200,
  });
}
