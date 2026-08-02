import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import PropTypes from 'prop-types';

export function PaginationControls({
  pageIndex,
  pageSize,
  total,
  onPageChange,
}) {
  const totalPages = Math.ceil(total / pageSize);

  if (total <= pageSize) return null;

  const getVisiblePages = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      const start = Math.max(2, pageIndex);
      const end = Math.min(totalPages - 1, pageIndex + 2);

      if (start > 2) pages.push('ellipsis-start');

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) pages.push('ellipsis-end');

      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (pageIndex > 0) onPageChange(pageIndex - 1);
            }}
            className={pageIndex === 0 ? 'pointer-events-none opacity-50' : ''}
          />
        </PaginationItem>

        {visiblePages.map((page) => {
          if (typeof page === 'string') {
            return (
              <PaginationItem key={page}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === pageIndex + 1}
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page - 1);
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (pageIndex + 1 < totalPages) onPageChange(pageIndex + 1);
            }}
            className={
              pageIndex + 1 >= totalPages
                ? 'pointer-events-none opacity-50'
                : ''
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

PaginationControls.propTypes = {
  pageIndex: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};
