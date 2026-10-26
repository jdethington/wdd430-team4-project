import UsersTable from "@/components/admin/UsersTable";

export default function AdminUsersPage() {
  return (
    <main className="min-h-[80vh] px-4 py-12">
      <div className="max-w-7xl mx-auto space-y-8">
        <div>
          <p className="text-[#f5c518] text-xs uppercase tracking-[0.3em] font-semibold mb-2">
            Admin
          </p>
          <h1 className="font-serif text-4xl font-bold text-[#f5f5f4]">
            Users
          </h1>
          <p className="text-[#afb6c2] mt-2">
            Manage accounts, roles, and access status.
          </p>
        </div>
        <UsersTable />
      </div>
    </main>
  );
}
