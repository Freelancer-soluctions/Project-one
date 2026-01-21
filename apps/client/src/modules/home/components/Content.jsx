import { Suspense } from 'react';
import { Outlet } from 'react-router';
import { Spinner } from '@/components/ui/spinner';

export const Content = () => {
  return (
    <main className="flex flex-col flex-1">
      <Suspense fallback={<Spinner />}>
        <Outlet />
      </Suspense>
    </main>
  );
};

export default Content;
