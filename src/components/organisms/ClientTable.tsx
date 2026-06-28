import { useState, useRef, useEffect, type ReactNode } from 'react';
import type { Client } from '@/types/client';
import StatusBadge from '@/components/molecules/StatusBadge';
import Button from '@/components/atoms/Button';

export interface ClientTableProps {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDeactivate: (client: Client) => void;
  onReactivate: (client: Client) => void;
}

interface DropdownState {
  clientId: number | null;
}

function ActionsDropdown({
  client,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
}: {
  client: Client;
  onView: (c: Client) => void;
  onEdit: (c: Client) => void;
  onDeactivate: (c: Client) => void;
  onReactivate: (c: Client) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  function handleAction(fn: (c: Client) => void) {
    return () => {
      fn(client);
      setOpen(false);
    };
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Actions"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </Button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-44 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="py-1">
            <button
              type="button"
              onClick={handleAction(onView)}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              View
            </button>
            <button
              type="button"
              onClick={handleAction(onEdit)}
              className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
            >
              Edit
            </button>
            {client.status === 'active' ? (
              <button
                type="button"
                onClick={handleAction(onDeactivate)}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
              >
                Deactivate
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAction(onReactivate)}
                className="block w-full px-4 py-2 text-left text-sm text-green-600 hover:bg-green-50"
              >
                Reactivate
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** Responsive table cell wrapper — visible on all screen sizes. */
function Td({ children, label }: { children: ReactNode; label: string }) {
  return (
    <td className="px-4 py-3 text-sm text-gray-700 md:table-cell">
      <span className="font-medium text-gray-500 md:hidden">{label}: </span>
      {children}
    </td>
  );
}

export default function ClientTable({
  clients,
  onView,
  onEdit,
  onDeactivate,
  onReactivate,
}: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-sm text-gray-500">No clients found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="hidden bg-gray-50 md:table-header-group">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Email
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Phone
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {clients.map((client) => (
            <tr key={client.id} className="flex flex-col border-b border-gray-100 last:border-b-0 md:table-row md:border-b-0">
              <Td label="Name">
                <span className="font-medium text-gray-900">{client.name}</span>
              </Td>
              <Td label="Email">
                <a
                  href={`mailto:${client.email}`}
                  className="text-blue-600 hover:text-blue-800"
                  onClick={(e) => e.stopPropagation()}
                >
                  {client.email}
                </a>
              </Td>
              <Td label="Phone">{client.phone}</Td>
              <Td label="Status">
                <StatusBadge status={client.status} />
              </Td>
              <td className="px-4 py-3 text-right md:table-cell">
                <div className="flex items-center justify-end gap-2">
                  <ActionsDropdown
                    client={client}
                    onView={onView}
                    onEdit={onEdit}
                    onDeactivate={onDeactivate}
                    onReactivate={onReactivate}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
