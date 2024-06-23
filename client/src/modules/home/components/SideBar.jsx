import {
  HomeIcon,
  InfoIcon,
  PackageIcon,
  ListOrderedIcon,
  UsersIcon,
} from "../../../utils/icons/icons";
import { Link } from "react-router-dom";
import Loader from "../../../components/loader/Loader";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";

const SideBar = () => {
  return (
    <div className="flex flex-1">
      <div className="flex-col hidden p-4 shadow-sm lg:flex bg-background">
        <nav className="flex flex-col gap-2">
          <Link
            href="#"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            prefetch={false}
          >
            <HomeIcon className="w-5 h-5" />
            Home
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            prefetch={false}
          >
            <InfoIcon className="w-5 h-5" />
            Analytics
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            prefetch={false}
          >
            <PackageIcon className="w-5 h-5" />
            Products
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            prefetch={false}
          >
            <ListOrderedIcon className="w-5 h-5" />
            Orders
          </Link>
          <Link
            href="#"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
            prefetch={false}
          >
            <UsersIcon className="w-5 h-5" />
            Customers
          </Link>
        </nav>
      </div>

      <main>
        <Suspense fallback={<Loader />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
};

export default SideBar;
