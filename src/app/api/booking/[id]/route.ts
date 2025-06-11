import { PrismaClient } from "@prisma/client";
import { decode } from "next-auth/jwt";

const prisma = new PrismaClient();

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

  // Get the booking ID from the path parameter
  const { id } = await params;
  let bookingId = id;

  // If the ID from the path is invalid, try query params or body as fallback
  if (!bookingId || bookingId === "undefined") {
    // Try to get bookingId from URL query parameters
    const url = new URL(req.url);
    const queryBookingId = url.searchParams.get("bookingId");

    if (queryBookingId) {
      bookingId = queryBookingId;
    }

    // If still no ID, try request body as a last resort
    if (!bookingId) {
      try {
        const body = await req.json();
        bookingId = body.bookingId;
      } catch (error) {
        console.error("Error parsing request body:", error);
      }
    }
  }

  console.log("Booking ID:", bookingId);

  if (!bookingId) {
    return new Response(JSON.stringify({ error: "Booking ID is required" }), {
      status: 400,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId },
      include: {
        schedule: {
          include: {
            departure: true,
            arrival: true,
          },
        },
      },
    });

    if (!booking) {
      return new Response(JSON.stringify({ error: "Booking not found" }), {
        status: 404,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      });
    }

    return new Response(JSON.stringify(booking), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching booking:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  }
}
