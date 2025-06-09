const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcryptjs");
const { addDays, setHours, setMinutes, setSeconds } = require("date-fns");

const prisma = new PrismaClient();

async function main() {
  // // 1️⃣ Create users
  // await prisma.user.create({
  //   data: {
  //     name: "John Doe",
  //     email: "john@example.com",
  //     password: await hash("user123", 10),
  //     phoneNumber: "081213456789",
  //     gender: "male",
  //   },
  // });

  // await prisma.user.create({
  //   data: {
  //     name: "sultan",
  //     email: "sultan@gmail.com",
  //     password: await hash("user123", 10),
  //     phoneNumber: "081222222222",
  //     gender: "male",
  //   },
  // });

  // // 2️⃣ Create cities
  // const cityNames = [
  //   "Buahbatu",
  //   "Metro Indah Mall",
  //   "Jatinangor",
  //   "Simpang Dago",
  //   "Bandara Soekarno Hatta",
  // ];

  // const cities = [];
  // for (const name of cityNames) {
  //   const city = await prisma.city.create({ data: { name } });
  //   cities.push(city);
  // }

  // 3️⃣ Create vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      name: "Travel Bus",
      type: "Travel", // Could also be "Travel"
      capacity: 10,
      plate: "D 1234 BC",
    },
  });

  // 4️⃣ Create daily schedules for next 30 days
  const tripTimes = [5, 8, 11, 14, 17, 20];
  const today = new Date();

  for (let dayOffset = 0; dayOffset < 10; dayOffset++) {
    const date = addDays(today, dayOffset);

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

      // Arrival is 2 hours later
      const arrivalAt = new Date(departureAt.getTime() + 2 * 60 * 60 * 1000);

      await prisma.schedule.create({
        data: {
          vehicleId: vehicle.id,
          departureId: "cmbovl9tz0002yzkcg93wn9jh",
          arrivalId: "cmbovlakc0004yzkc7fydoluu",
          departureAt,
          arrivalAt,
          price: 100000,
          seats: 10,
        },
      });
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
