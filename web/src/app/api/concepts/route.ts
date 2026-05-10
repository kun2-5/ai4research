import { NextResponse } from "next/server";
import { getConcepts } from "@/lib/wiki/reader";

export async function GET() {
  const concepts = getConcepts();
  return NextResponse.json(concepts);
}
