import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

const prisma = new PrismaClient();

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });

  if (
    !user ||
    !user.password ||
    !(await bcrypt.compare(password, user.password))
  ) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  const token = await encode({
    token: { id: user.id },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return new Response(JSON.stringify({ token }), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
    },
  });
}
