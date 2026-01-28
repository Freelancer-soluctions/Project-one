import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import PropTypes from 'prop-types';
import { flexRender } from '@tanstack/react-table';

export const CellWithTooltip = ({ cell }) => {
  const content = flexRender(cell.column.columnDef.cell, cell.getContext());

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="truncate">{content}</div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs break-words">{content}</p>
      </TooltipContent>
    </Tooltip>
  );
};

CellWithTooltip.propTypes = {
  cell: PropTypes.object.isRequired,
};
