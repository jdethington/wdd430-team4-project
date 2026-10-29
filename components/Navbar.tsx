import { auth } from "@/auth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const session = await auth();

  return (
    <NavbarClient
      isLoggedIn={Boolean(session?.user)}
      isAdmin={session?.user?.role === "admin"}
      userName={session?.user?.name ?? ""}
    />
  );
}
