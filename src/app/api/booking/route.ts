import { PrismaClient } from "@prisma/client";
import { decode } from "next-auth/jwt";

const prisma = new PrismaClient();

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS, POST, PUT",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  const token = req.headers.get("Authorization")?.split(" ")[1];
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  const decodedToken = await decode({
    token,
    secret: process.env.NEXTAUTH_SECRET!,
  });

  if (!decodedToken || !decodedToken.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  const userId = decodedToken.id;
  const bookingData = await req.json();

  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: bookingData.scheduleId },
    });
    if (!schedule) {
      return new Response(JSON.stringify({ error: "Schedule not found" }), {
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    }

    if (schedule.seats <= 0) {
      return new Response(JSON.stringify({ error: "No seats available" }), {
        status: 400,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    }

    const booking = await prisma.booking.create({
      data: {
        userId,
        namaLengkap: bookingData.namaLengkap,
        email: bookingData.email,
        phoneNumber: bookingData.phoneNumber,
        scheduleId: bookingData.scheduleId,
        status: "pending",
        type: bookingData.type,
      },
    });

    if (bookingData.type !== "paket") {
      const schedule2 = await prisma.schedule.update({
        where: { id: bookingData.scheduleId },
        data: {
          seats: {
            increment: -1,
          },
        },
      });
      if (!booking || !schedule2) {
        return new Response(JSON.stringify({ error: "Booking failed" }), {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
        });
      }
    }

    return new Response(JSON.stringify(booking), {
      status: 201,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Booking error:", error);
    return new Response(JSON.stringify({ error: "Booking failed" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
}
