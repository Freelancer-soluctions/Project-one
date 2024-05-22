import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { parseISO } from 'date-fns';
import { format, toZonedTime } from 'date-fns-tz';
import { CiMenuKebab } from "react-icons/ci";

const columns = [
  {
    accessorKey: "note",
    header: "Note",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const { description } = row.getValue('status');
      return <span className="text-right">{description}</span>
    }
  },
  {
    accessorKey: "userNoteClosed",
    header: "Closed By",
    cell: ({ row }) => {
      const { email } = row.getValue('userNoteClosed');
      return <span className="text-right">{email}</span>
    }
  },
  {
    accessorKey: "userNoteCreated",
    header: "Created By",
    cell: ({ row }) => {
      const { email } = row.getValue('userNoteCreated');
      return <span className="text-right">{email}</span>
    }

  },
  {
    accessorKey: "createdOn",
    header: "Created On",
    cell: ({ row }) => {
      const date = row.getValue('createdOn');
      return <span className="text-right">
        {

          format(toZonedTime(parseISO(date), 'UTC'), 'yyyy-MM-dd', {
            timeZone: 'UTC'
          })

        }
      </span>
    }
  },
  {
    accessorKey: "closedOn",
    header: "Closed On",
    cell: ({ row }) => {
      const date = row.getValue('closedOn');
      return <span className="text-right">
        {
          format(toZonedTime(parseISO(date), 'UTC'), 'yyyy-MM-dd', {
            timeZone: 'UTC'
          })
        }
      </span>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => { 
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <CiMenuKebab className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  }

]

export default columns