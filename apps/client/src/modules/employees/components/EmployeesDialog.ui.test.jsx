import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { EmployeesDialog } from './EmployeesDialog';

// Los selects cargan los catálogos desde RTK Query; aquí se sustituyen por
// fixtures para probar el cableado del diálogo sin red.
vi.mock('../api/employeesApi', () => ({
  useGetPositionOptionsQuery: () => ({
    data: {
      data: {
        dataList: [
          { id: 1, name: 'Analista' },
          { id: 2, name: 'Gerente' },
        ],
      },
    },
  }),
  useGetDepartmentOptionsQuery: () => ({
    data: {
      data: {
        dataList: [
          { id: 1, name: 'Operaciones' },
          { id: 2, name: 'Ventas' },
        ],
      },
    },
  }),
}));

// Radix Select usa APIs de puntero y scroll que jsdom no implementa.
beforeAll(() => {
  Element.prototype.hasPointerCapture = () => false;
  Element.prototype.setPointerCapture = () => {};
  Element.prototype.releasePointerCapture = () => {};
  Element.prototype.scrollIntoView = () => {};
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const EMPLOYEE_ROW = {
  id: 7,
  name: 'Ana',
  lastName: 'Pérez',
  dni: '12345678',
  email: 'ana@example.com',
  phone: '',
  address: '',
  startDate: '2024-01-01T00:00:00.000Z',
  positionId: 1,
  departmentId: 1,
  salary: '2500.50',
  createdOn: '2024-01-02T00:00:00.000Z',
  updatedOn: null,
  userEmployeeCreatedName: 'Admin',
  userEmployeeUpdatedName: '',
};

const renderDialog = (props = {}) => {
  const onSubmit = vi.fn();
  render(
    <EmployeesDialog
      openDialog
      onCloseDialog={() => {}}
      selectedRow={{}}
      onSubmit={onSubmit}
      onDeleteById={() => {}}
      actionDialog="Add employee"
      {...props}
    />
  );
  return { onSubmit };
};

/** Abre un select del diálogo y elige una opción por su texto. */
const selectOption = async (user, label, optionName) => {
  await user.click(screen.getByLabelText(label));
  await user.click(await screen.findByRole('option', { name: optionName }));
};

describe('EmployeesDialog - catalog selects', () => {
  it('lists the position and department catalog options', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByLabelText(/position/i));
    expect(
      await screen.findByRole('option', { name: 'Analista' })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Gerente' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await user.click(screen.getByLabelText(/department/i));
    expect(
      await screen.findByRole('option', { name: 'Operaciones' })
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Ventas' })).toBeInTheDocument();
  });

  it('submits the catalog ids as numbers on create', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    await user.type(screen.getByLabelText(/^name/i), 'Ana');
    await user.type(screen.getByLabelText(/last name/i), 'Pérez');
    await user.type(screen.getByLabelText(/dni/i), '12345678');
    await user.type(screen.getByLabelText(/email/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/salary/i), '2500.5');

    await selectOption(user, /position/i, 'Gerente');
    await selectOption(user, /department/i, 'Ventas');

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          positionId: 2,
          departmentId: 2,
          name: 'Ana',
        })
      )
    );
    const payload = onSubmit.mock.calls[0][0];
    expect(typeof payload.positionId).toBe('number');
    expect(typeof payload.departmentId).toBe('number');
  });

  it('blocks submit and shows the translated errors when no catalog is selected', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog();

    await user.type(screen.getByLabelText(/^name/i), 'Ana');
    await user.type(screen.getByLabelText(/last name/i), 'Pérez');
    await user.type(screen.getByLabelText(/dni/i), '12345678');
    await user.type(screen.getByLabelText(/email/i), 'ana@example.com');
    await user.type(screen.getByLabelText(/salary/i), '2500.5');
    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(
      await screen.findByText('Position is required.')
    ).toBeInTheDocument();
    expect(screen.getByText('Department is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('prefills the selects on edit and PATCHes only the changed catalog', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderDialog({ selectedRow: EMPLOYEE_ROW });

    expect(screen.getByLabelText(/position/i)).toHaveTextContent('Analista');
    expect(screen.getByLabelText(/department/i)).toHaveTextContent(
      'Operaciones'
    );

    await selectOption(user, /position/i, 'Gerente');
    await user.click(screen.getByRole('button', { name: /^update$/i }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ id: 7, body: { positionId: 2 } })
    );
  });
});
