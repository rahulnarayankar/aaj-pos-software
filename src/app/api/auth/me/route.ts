import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/http";

export async function GET() {
  const { staff, response } = await requireStaff();
  if (!staff) return response;
  return NextResponse.json({ staff });
}
