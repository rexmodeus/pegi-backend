import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email, password } = await req.json();
  const user = await prisma.user.findUnique({ where: { email } });

  if (
    !user ||
    !user.password ||
    !(await bcrypt.compare(password, user.password))
  ) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await encode({
    token: {
      id: user.id,
    },
    secret: process.env.NEXTAUTH_SECRET!,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return Response.json({ token });
}
