import { getToken } from "next-auth/jwt";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return res.redirect("myapp://callback?error=unauthorized");
  }

  const accessToken = token.accessToken || token.sub;

  return res.redirect(`myapp://callback?token=${accessToken}`);
}
