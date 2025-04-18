import { NextResponse } from "next/server"

export async function GET() {
  return new NextResponse(JSON.stringify({ status: "ok", message: "API funcionando corretamente" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  })
}
