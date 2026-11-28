import {
  useLazyGetAllPositionsQuery,
  useCreatePositionMutation,
  useUpdatePositionByIdMutation,
  useDeletePositionByIdMutation,
  useLazyGetAllDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentByIdMutation,
  useDeleteDepartmentByIdMutation,
} from '@/modules/employees/api/employeesApi';
import { EmployeeCatalogManager } from './EmployeeCatalogManager';

export { EmployeeCatalogFiltersForm } from './EmployeeCatalogFiltersForm';
export { EmployeeCatalogDatatable } from './EmployeeCatalogDatatable';
export { EmployeeCatalogDialog } from './EmployeeCatalogDialog';
export { EmployeeCatalogManager } from './EmployeeCatalogManager';

const POSITIONS_CONFIG = {
  kind: 'position',
  addTitleKey: 'add_position',
  editTitleKey: 'edit_position',
  useLazyList: useLazyGetAllPositionsQuery,
  useCreate: useCreatePositionMutation,
  useUpdate: useUpdatePositionByIdMutation,
  useDelete: useDeletePositionByIdMutation,
};

const DEPARTMENTS_CONFIG = {
  kind: 'department',
  addTitleKey: 'add_department',
  editTitleKey: 'edit_department',
  useLazyList: useLazyGetAllDepartmentsQuery,
  useCreate: useCreateDepartmentMutation,
  useUpdate: useUpdateDepartmentByIdMutation,
  useDelete: useDeleteDepartmentByIdMutation,
};

export const PositionsManager = () => (
  <EmployeeCatalogManager config={POSITIONS_CONFIG} />
);

export const DepartmentsManager = () => (
  <EmployeeCatalogManager config={DEPARTMENTS_CONFIG} />
);
