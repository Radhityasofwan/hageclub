import { AdminUserForm } from "@/components/admin/admin-user-form";

export default function NewAdminUserPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-bold">New Admin User</h1>
        <p className="text-sm text-muted">Create a new administrator or staff account.</p>
      </div>
      <AdminUserForm />
    </div>
  );
}
