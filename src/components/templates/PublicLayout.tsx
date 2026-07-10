import { Outlet } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <main className="px-4 md:px-[--spacing-margin-desktop]">
      <Outlet />
    </main>
  );
}
