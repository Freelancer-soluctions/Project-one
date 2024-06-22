import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Loader from "@/components/loader/Loader";

const Home = () => {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <header className="flex items-center h-16 px-4 border-b shrink-0 md:px-6">
        <Link
          href="#"
          className="flex items-center gap-2 text-lg font-semibold md:text-base"
          prefetch={false}
        >
          <MountainIcon className="w-6 h-6" />
          <span>Dashboard App</span>
        </Link>
        <nav className="flex-col hidden gap-6 ml-auto text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
          <Link href="#" className="font-bold" prefetch={false}>
            Home
          </Link>
          <Link href="#" className="text-muted-foreground" prefetch={false}>
            Analytics
          </Link>
          <Link href="#" className="text-muted-foreground" prefetch={false}>
            Settings
          </Link>
          <Link href="#" className="text-muted-foreground" prefetch={false}>
            Support
          </Link>
        </nav>
      </header>
      <div className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 gap-4 p-4 md:gap-8 md:p-10">
        <nav className="flex-col hidden w-64 gap-4 md:flex shrink-0">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2"
            asChild
          >
            <Link href="#" className="font-medium" prefetch={false}>
              <HomeIcon className="w-4 h-4" />
              Home
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2"
            asChild
          >
            <Link
              href="#"
              className="font-medium text-muted-foreground"
              prefetch={false}
            >
              <BarChartIcon className="w-4 h-4" />
              Analytics
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2"
            asChild
          >
            <Link
              href="#"
              className="font-medium text-muted-foreground"
              prefetch={false}
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-2"
            asChild
          >
            <Link
              href="#"
              className="font-medium text-muted-foreground"
              prefetch={false}
            >
              <CircleHelpIcon className="w-4 h-4" />
              Support
            </Link>
          </Button>
        </nav>
        <main className="grid flex-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Suspense fallback={<Loader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default Home;

function BarChartIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

function CircleHelpIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function HomeIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function MountainIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

function SettingsIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
