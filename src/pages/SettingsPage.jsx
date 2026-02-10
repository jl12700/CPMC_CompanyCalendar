import MainLayout from '../components/layout/MainLayout';
const SettingsPage = () => {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Settings</h2>
            <p className="text-sm text-gray-600">Profile settings and preferences will be available in future updates.</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Notifications</h2>
            <p className="text-sm text-gray-600">Notification preferences will be available in future updates.</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendar Preferences</h2>
            <p className="text-sm text-gray-600">Calendar customization options will be available in future updates.</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SettingsPage;
