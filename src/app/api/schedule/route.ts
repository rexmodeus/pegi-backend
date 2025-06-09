import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const departureCityId = searchParams.get("departureCityId");
  const arrivalCityId = searchParams.get("arrivalCityId");
  const dateString = searchParams.get("date"); // expected format: YYYY-MM-DD
  const vehicleType = searchParams.get("vehicleType"); // optional, e.g., "Bus" or "Travel"

  if (!departureCityId || !arrivalCityId || !dateString) {
    return NextResponse.json(
      { message: "Missing required query parameters" },
      { status: 400 }
    );
  }

  // Parse date
  const date = new Date(dateString);
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  try {
    const schedules = await prisma.schedule.findMany({
      where: {
        departureId: departureCityId,
        arrivalId: arrivalCityId,
        departureAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        vehicle: {
          type: vehicleType || undefined, // optional filter by vehicle type
        },
      },
      include: {
        vehicle: true,
        departure: true,
        arrival: true,
      },
      orderBy: {
        departureAt: "desc",
      },
    });

    return new Response(JSON.stringify(schedules), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

// example body for get request
// GET /api/schedule?departureCityId=1&arrivalCityId=2&date=2023-10-01
