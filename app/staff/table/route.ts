import { NextRequest, NextResponse } from "next/server"

export function GET(req: NextRequest) {
  const table = req.nextUrl.searchParams.get("table")
  const store = req.nextUrl.searchParams.get("store")
  if (table) {
    const dest = new URL(`/staff/table/${table}`, req.url)
    if (store) dest.searchParams.set("store", store)
    return NextResponse.redirect(dest)
  }
  return NextResponse.redirect(new URL("/staff", req.url))
}
