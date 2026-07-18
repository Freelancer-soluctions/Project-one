import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

export default {
  title: 'UI/Table',
  component: Table,
  parameters: {
    layout: 'centered',
  },
};

export const DefaultTable = () => (
  <Table className="border border-collapse border-gray-300">
    <TableHeader>
      <TableRow>
        <TableHead className="px-4 py-2 border border-gray-300">
          Nombre
        </TableHead>
        <TableHead className="px-4 py-2 border border-gray-300">Edad</TableHead>
        <TableHead className="px-4 py-2 border border-gray-300">
          Ciudad
        </TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>
        <TableCell className="px-4 py-2 border border-gray-300">
          Juan Pérez
        </TableCell>
        <TableCell className="px-4 py-2 border border-gray-300">30</TableCell>
        <TableCell className="px-4 py-2 border border-gray-300">
          Madrid
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell className="px-4 py-2 border border-gray-300">
          María López
        </TableCell>
        <TableCell className="px-4 py-2 border border-gray-300">25</TableCell>
        <TableCell className="px-4 py-2 border border-gray-300">
          Barcelona
        </TableCell>
      </TableRow>
    </TableBody>
  </Table>
);
