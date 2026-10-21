import type { Prisma, vacationStatus } from '@prisma/client';

/** Vacation row as stored in the database. */
export type VacationRecord = Prisma.vacationGetPayload<object>;

/** Row returned by the filtered list query (vacation + joined names). */
export type VacationListItem = VacationRecord & {
  employeeName: string | null;
  userVacationCreatedName: string | null;
  userVacationUpdatedName: string | null;
};

/** Paginated vacation list. */
export interface VacationsPage {
  dataList: VacationListItem[];
  total: number;
}

/** Query parameters accepted by the vacation listing endpoint. */
export interface VacationsQuery {
  page?: number;
  limit?: number;
  employeeId?: number;
  status?: vacationStatus;
  fromDate?: Date | string;
  toDate?: Date | string;
}

/** Filters accepted by the vacation list query. */
export interface VacationListFilters {
  employeeId?: number;
  status?: vacationStatus;
  fromDate?: Date | string;
  toDate?: Date | string;
}

/** Payload used to create a vacation record. */
export interface VacationCreateData {
  employeeId: number;
  startDate: Date;
  endDate: Date;
  status?: vacationStatus;
  createdBy?: number;
  createdOn: Date;
}

/** Payload used to update a vacation record. */
export interface VacationUpdateData {
  employeeId?: number;
  startDate?: Date;
  endDate?: Date;
  status?: vacationStatus;
  updatedBy?: number;
  updatedOn?: Date;
}

/** Vacation body accepted by the create/patch endpoints (raw request values). */
export interface VacationInput {
  employeeId?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: vacationStatus;
  type?: string;
  reason?: string;
  createdBy?: number;
  updatedBy?: number;
}
