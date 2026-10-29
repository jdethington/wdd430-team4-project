import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AccountPageClient from "@/components/account/AccountPageClient";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/account");

  return (
    <main className="min-h-[80vh] px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <p className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold mb-2">
            Account
          </p>
          <h1 className="font-serif text-4xl font-bold text-[#f5f5f4]">
            Your profile
          </h1>
          <p className="text-[#afb6c2] mt-2">
            Manage your email, password, and account.
          </p>
        </div>

        <AccountPageClient
          initialName={session.user.name ?? ""}
          initialEmail={session.user.email ?? ""}
        />
      </div>
    </main>
  );
}
