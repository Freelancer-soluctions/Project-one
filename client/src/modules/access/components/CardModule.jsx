import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { DollarSignIcon } from "../../../utils/icons/icons";

const CardModule = () => {
  return (
    <div className="flex-1 p-4 overflow-auto md:p-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
            <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link
            to={`note`}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
             
            >
              Go to notes
            </Link>
            
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Notes</CardTitle>
            <DollarSignIcon className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Link
              href="#"
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors rounded-md hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
          
            >
              Products
            </Link>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CardModule;
