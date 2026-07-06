import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#f7f1ff]">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <TopBar />
        <main className="mx-auto w-full max-w-7xl px-4 py-5 lg:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
