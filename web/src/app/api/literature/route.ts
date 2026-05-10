import { NextResponse } from "next/server";
import { getLiterature } from "@/lib/wiki/reader";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get("tier") ?? undefined;
  const literature = getLiterature(tier);
  return NextResponse.json(literature);
}
