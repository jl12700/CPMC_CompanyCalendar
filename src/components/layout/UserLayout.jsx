import UserSidebar from './userSidebar';
import UserTopBar from './userTopBar';

export default function UserLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <UserSidebar />
      <UserTopBar />
      <main className="ml-56 mt-16 p-6">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}