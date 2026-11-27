import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { sessionCookieOptions, signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearAttempts, clientKey, recordFailure, tooManyAttempts } from "@/lib/rate-limit";

const bodySchema = z.object({
  pin: z.string().regex(/^\d{4}$/, "Enter the 4-digit PIN."),
});

export async function POST(request: Request) {
  const key = clientKey(request);
  if (tooManyAttempts(key)) {
    return NextResponse.json(
      { error: "Too many tries. Wait 15 minutes and try again." },
      { status: 429 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    recordFailure(key);
    return NextResponse.json({ error: "Enter the 4-digit PIN." }, { status: 400 });
  }

  let staff;
  try {
    staff = await prisma.staff.findMany({ where: { active: true } });
  } catch {
    const missing = !process.env.DATABASE_URL;
    return NextResponse.json(
      {
        error: missing
          ? "DATABASE_URL is not set on this server."
          : "The database could not be reached. Check the Supabase connection string.",
      },
      { status: 503 },
    );
  }

  let match: (typeof staff)[number] | null = null;
  for (const person of staff) {
    if (await bcrypt.compare(parsed.data.pin, person.pinHash)) {
      match = person;
      break;
    }
  }

  if (!match) {
    recordFailure(key);
    return NextResponse.json({ error: "That PIN is not recognised." }, { status: 401 });
  }

  clearAttempts(key);

  const token = await signSession({
    id: match.id,
    name: match.name,
    role: match.role,
  });

  const response = NextResponse.json({
    staff: { id: match.id, name: match.name, role: match.role },
  });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
