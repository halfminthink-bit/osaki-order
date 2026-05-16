import { NextRequest, NextResponse } from "next/server"

export function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get("table")
  if (table) {
    return NextResponse.redirect(new URL(`/staff/table/${table}`, req.url))
  }
  return NextResponse.redirect(new URL("/staff", req.url))
}
