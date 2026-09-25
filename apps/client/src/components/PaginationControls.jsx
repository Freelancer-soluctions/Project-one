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

/**
 * Estilos del Previous/Next cuando están deshabilitados.
 */
const DISABLED_CLASS = 'pointer-events-none opacity-50';

/**
 * Renderiza un item de página: elipsis ('ellipsis-*') o link numerado.
 *
 * @param {Object} p - Props del item.
 * @param {number|string} p.page - Número de página (1-index) o 'ellipsis-start'/'ellipsis-end'.
 * @param {number} p.pageIndex - Índice de página actual (0-index).
 * @param {Function} p.onPageChange - Callback al cambiar de página.
 * @returns {JSX.Element} Item de paginación.
 */
const PageItem = ({ page, pageIndex, onPageChange }) => {
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
};

PageItem.propTypes = {
  page: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  pageIndex: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};

/**
 * Construye la lista de páginas visibles (números y marcadores de elipsis).
 *
 * @param {number} pageIndex - Índice de página actual (0-index).
 * @param {number} totalPages - Total de páginas.
 * @returns {Array<number|string>} Páginas a renderizar.
 */
const getVisiblePages = (pageIndex, totalPages) => {
  const maxVisible = 5;

  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];
  const start = Math.max(2, pageIndex);
  const end = Math.min(totalPages - 1, pageIndex + 2);

  if (start > 2) pages.push('ellipsis-start');

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) pages.push('ellipsis-end');

  pages.push(totalPages);
  return pages;
};

export function PaginationControls({
  pageIndex,
  pageSize,
  total,
  onPageChange,
}) {
  const totalPages = Math.ceil(total / pageSize);

  if (total <= pageSize) return null;

  const visiblePages = getVisiblePages(pageIndex, totalPages);

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
            className={pageIndex === 0 ? DISABLED_CLASS : ''}
          />
        </PaginationItem>

        {visiblePages.map((page) => (
          <PageItem
            key={page}
            page={page}
            pageIndex={pageIndex}
            onPageChange={onPageChange}
          />
        ))}

        <PaginationItem>
          <PaginationNext
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (pageIndex + 1 < totalPages) onPageChange(pageIndex + 1);
            }}
            className={pageIndex + 1 >= totalPages ? DISABLED_CLASS : ''}
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
