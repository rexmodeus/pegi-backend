import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
