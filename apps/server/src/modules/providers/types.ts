import type { Prisma } from '@prisma/client';

/** Provider row as stored in the database. */
export type ProviderRecord = Prisma.productProvidersGetPayload<object>;

/** Row returned by the filtered list query (provider + joined user names). */
export type ProviderListItem = ProviderRecord & {
  statusText: string;
  userProvidersCreatedName: string | null;
  userProvidersUpdatedName: string | null;
};

/** Filters accepted by the provider list query. */
export interface ProvidersListFilters {
  name?: string;
  status?: boolean | null;
}

/** Query parameters accepted by the provider listing endpoint. */
export interface ProvidersQuery extends ProvidersListFilters {
  limit?: number;
  page?: number;
}

/** Paginated provider list. */
export interface ProvidersPage {
  dataList: ProviderListItem[];
  total: number;
}

/** Payload used to create a provider. */
export interface ProviderCreateData {
  code: string;
  name: string;
  status: boolean;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  createdOn: Date;
  createdBy: number;
}

/** Payload used to update a provider. */
export interface ProviderUpdateData {
  code?: string;
  name?: string;
  status: boolean;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  updatedOn: Date;
  updatedBy: number;
}

/** Provider body accepted by the create/update endpoints (raw request values). */
export interface ProviderInput {
  code?: string;
  name?: string;
  status?: boolean | string | number;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
}
