import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function requireStaff() {
  const staff = await getSession();
  if (!staff) {
    return {
      staff: null,
      response: NextResponse.json({ error: "Sign in required." }, { status: 401 }),
    };
  }
  return { staff, response: null };
}

export async function requireManager() {
  const result = await requireStaff();
  if (!result.staff) return result;
  if (result.staff.role !== "MANAGER") {
    return {
      staff: null,
      response: NextResponse.json({ error: "A manager has to change the menu." }, { status: 403 }),
    };
  }
  return result;
}

export function errorMessage(error: unknown) {
  if (error instanceof Error && error.message && !error.message.includes("\n")) {
    return error.message;
  }
  return "The bill could not be saved. Try again.";
}
