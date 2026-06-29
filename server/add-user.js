import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const email = "pandasomnath885@gmail.com";
    const name = "Somnath Panda";
    const id = process.argv[2];

    if (!id) {
        console.error("Please provide the Clerk User ID as an argument. Example:\nnode add-user.js user_123abc");
        process.exit(1);
    }

    try {
        const user = await prisma.user.create({
            data: { id, email, name }
        });
        console.log("\nSuccess! User has been added to the database:", user);
    } catch (error) {
        console.error("\nError creating user:", error.message || error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
