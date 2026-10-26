"use client";

import { useState } from "react";
import AccountAlerts from "@/components/account/AccountAlerts";
import ProfileForm from "@/components/account/ProfileForm";
import PasswordForm from "@/components/account/PasswordForm";
import DeleteAccountPanel from "@/components/account/DeleteAccountPanel";

export default function AccountPageClient({
  initialName,
  initialEmail,
}: {
  initialName: string;
  initialEmail: string;
}) {
  const [passwordJustUpdated, setPasswordJustUpdated] = useState(false);

  return (
    <div className="space-y-10">
      <AccountAlerts passwordJustUpdated={passwordJustUpdated} />

      <section className="bg-[#2c2c2c] border border-[#f5c518]/20 rounded-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#f5f5f4]">Profile</h2>
        <ProfileForm initialName={initialName} initialEmail={initialEmail} />
      </section>

      <section className="bg-[#2c2c2c] border border-[#f5c518]/20 rounded-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#f5f5f4]">Password</h2>
        <PasswordForm onPasswordUpdated={() => setPasswordJustUpdated(true)} />
      </section>

      <section className="bg-[#2c2c2c] border border-red-500/30 rounded-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-400">Danger zone</h2>
        <DeleteAccountPanel />
      </section>
    </div>
  );
}
