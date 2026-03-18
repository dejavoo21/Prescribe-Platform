export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Administration</h1>
        <p className="text-gray-600">System overview and management</p>
      </div>

      {/* TODO: Add admin dashboard widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Total Users</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Pending Verification</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Total Prescriptions</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <p className="text-xl font-bold text-green-600 mt-2">Operational</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">User Management</h2>
        <p className="text-gray-600">No pending user approvals</p>
      </div>
    </div>
  );
}
