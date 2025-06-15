const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");
const { addDays, setHours, setMinutes, setSeconds } = require("date-fns");

const prisma = new PrismaClient();

async function main() {
  // 1️⃣ Create users
  await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john@example.com",
      password: await hash("user123", 10),
      phoneNumber: "081213456789",
      gender: "male",
    },
  });

  await prisma.user.create({
    data: {
      name: "sultan",
      email: "sultan@gmail.com",
      password: await hash("user123", 10),
      phoneNumber: "081222222222",
      gender: "male",
    },
  });

  // 2️⃣ Create cities
  const cityNames = [
    "Buahbatu",
    "Jatinangor",
    "Simpang Dago",
    "Bandara Soekarno Hatta",
  ];

  const cities = [];
  for (const name of cityNames) {
    const city = await prisma.city.create({ data: { name } });
    cities.push(city);
  }

  // 3️⃣ Create vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      name: "Travel",
      type: "Travel", // Could also be "Travel"
      capacity: 10,
      plate: "D 1234 BC",
    },
  });

  const vehicleBus = await prisma.vehicle.create({
    data: {
      name: "Bus",
      type: "Bus", // Could also be "Travel"
      capacity: 30,
      plate: "D 5678 EF",
    },
  });

  // 4️⃣ Create daily schedules for next 30 days
  const tripTimes = [5, 8, 11, 14, 17, 20];
  const today = new Date();

  // Function to check if a route is valid
  function isValidRoute(
    departure: { id: string; name: string },
    arrival: { id: string; name: string }
  ) {
    // Skip routes between Buahbatu and Simpang Dago in both directions
    if (
      (departure.name === "Buahbatu" && arrival.name === "Simpang Dago") ||
      (departure.name === "Simpang Dago" && arrival.name === "Buahbatu")
    ) {
      return false;
    }
    // Don't create routes from a city to itself
    return departure.id !== arrival.id;
  }

  // Create routes between all valid city pairs
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const date = addDays(today, dayOffset);

    // Create routes between every valid city pair
    for (let i = 0; i < cities.length; i++) {
      for (let j = 0; j < cities.length; j++) {
        const departureCity = cities[i];
        const arrivalCity = cities[j];

        // Skip invalid routes
        if (!isValidRoute(departureCity, arrivalCity)) {
          continue;
        }

        // Set different prices based on cities
        let travelPrice = 100000; // Base price for Travel
        let busPrice = 75000; // Base price for Bus

        // Adjust prices for routes involving the airport
        if (
          departureCity.name.includes("Bandara") ||
          arrivalCity.name.includes("Bandara")
        ) {
          travelPrice = 150000;
          busPrice = 110000;
        }

        // Create schedules for both vehicle types for all valid routes
        const vehicleTypes = [
          { vehicle: vehicle, price: travelPrice, capacity: vehicle.capacity },
          {
            vehicle: vehicleBus,
            price: busPrice,
            capacity: vehicleBus.capacity,
          },
        ];

        for (const {
          vehicle: currentVehicle,
          price,
          capacity,
        } of vehicleTypes) {
          for (const hour of tripTimes) {
            // Build the departureAt time in local timezone
            const departureAt = new Date(
              date.getFullYear(),
              date.getMonth(),
              date.getDate(),
              hour + 7,
              0,
              0
            );

            // Arrival time varies based on distance and vehicle type
            let travelHours = currentVehicle.type === "Bus" ? 2.5 : 2; // Buses are slightly slower

            // Make airport routes take longer
            if (
              departureCity.name.includes("Bandara") ||
              arrivalCity.name.includes("Bandara")
            ) {
              travelHours = currentVehicle.type === "Bus" ? 3.5 : 3;
            }

            const arrivalAt = new Date(
              departureAt.getTime() + travelHours * 60 * 60 * 1000
            );

            // Create the schedule
            await prisma.schedule.create({
              data: {
                vehicle: {
                  connect: { id: currentVehicle.id },
                },
                departure: {
                  connect: { id: departureCity.id },
                },
                arrival: {
                  connect: { id: arrivalCity.id },
                },
                departureAt,
                arrivalAt,
                price,
                seats: capacity,
              },
            });
          }
        }
        console.log(
          `✅ Created schedules for ${cities[i].name} to ${
            cities[j].name
          } on ${date.toLocaleDateString()}`
        );
      }
    }
  }

  console.log("✅ Seed completed successfully with schedules!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
