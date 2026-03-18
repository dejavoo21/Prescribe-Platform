export default function PatientDashboard() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Health</h1>
        <p className="text-gray-600">Manage your prescriptions and medical information</p>
      </div>

      {/* TODO: Add patient dashboard widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Active Prescriptions</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Medication Reminders</h3>
          <p className="text-3xl font-bold text-orange-600 mt-2">0</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900">Allergies on File</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">0</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">My Prescriptions</h2>
        <p className="text-gray-600">No active prescriptions</p>
      </div>
    </div>
  );
}
