export default function PharmacyDashboard() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Pharmacy Dashboard</h1>
        <p className="text-gray-600">Manage incoming prescriptions and dispensing</p>
      </div>

      {/* TODO: Add pharmacy dashboard widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Pending Prescriptions</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Dispensed Today</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Low Stock Items</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">0</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Prescription Queue</h2>
        <p className="text-gray-600">No pending prescriptions</p>
      </div>
    </div>
  );
}
