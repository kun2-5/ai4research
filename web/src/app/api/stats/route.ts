import { NextResponse } from "next/server";
import { getWikiStats } from "@/lib/wiki/reader";

export async function GET() {
  const stats = getWikiStats();
  return NextResponse.json(stats);
}
