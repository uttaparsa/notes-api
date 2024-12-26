'use client';

import React from 'react';
import { Pagination } from 'react-bootstrap';

const PaginationComponent = ({ currentPage, totalCount, perPage, onPageChange }) => {
  const totalPages = Math.ceil(totalCount / perPage);
  let items = [];
  const maxVisiblePages = 3;
  const halfVisible = Math.floor(maxVisiblePages / 2);
  
  let startPage = Math.max(1, currentPage - halfVisible);
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  items.push(
    <Pagination.First key="first" onClick={() => onPageChange(1)} disabled={currentPage === 1} />,
    // <Pagination.Prev key="prev" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />
  );

  if (startPage > 1) {
    items.push(<Pagination.Ellipsis key="ellipsis-start" />);
  }

  for (let number = startPage; number <= endPage; number++) {
    items.push(
      <Pagination.Item className="z-0" key={number} active={number === currentPage} onClick={() => onPageChange(number)}>
        {number}
      </Pagination.Item>
    );
  }

  if (endPage < totalPages) {
    items.push(<Pagination.Ellipsis key="ellipsis-end" />);
  }

  items.push(
    // <Pagination.Next key="next" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} />,
    <Pagination.Last key="last" onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} />
  );

  return <Pagination className="custom-pagination justify-content-center mt-3">{items}</Pagination>;
};

export default PaginationComponent;