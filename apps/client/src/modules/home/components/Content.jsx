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
