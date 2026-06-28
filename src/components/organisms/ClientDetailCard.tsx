import type { Client } from '@/types/client';
import StatusBadge from '@/components/molecules/StatusBadge';
import Button from '@/components/atoms/Button';
import { formatDate } from '@/utils/format';

export interface ClientDetailCardProps {
  client: Client;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onBack: () => void;
  deactivateLoading?: boolean;
  reactivateLoading?: boolean;
}

interface DetailRowProps {
  label: string;
  value: string | null | undefined;
}

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="flex flex-col gap-1 py-2 sm:flex-row sm:gap-4">
      <dt className="min-w-[140px] text-sm font-medium text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900">
        {value || <span className="italic text-gray-400">Not provided</span>}
      </dd>
    </div>
  );
}

export default function ClientDetailCard({
  client,
  onEdit,
  onDeactivate,
  onReactivate,
  onBack,
  deactivateLoading = false,
  reactivateLoading = false,
}: ClientDetailCardProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900">{client.name}</h2>
            <StatusBadge status={client.status} />
          </div>
          <Button variant="ghost" size="sm" onClick={onBack}>
            &larr; Back to list
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-4">
        <dl className="divide-y divide-gray-100">
          <DetailRow label="Email" value={client.email} />
          <DetailRow label="Phone" value={client.phone} />
          <DetailRow label="Secondary Phone" value={client.phone2} />
          <DetailRow label="Address" value={client.address} />
          <DetailRow label="Created" value={formatDate(client.createdAt)} />
          <DetailRow label="Updated" value={formatDate(client.updatedAt)} />
        </dl>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 border-t border-gray-200 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
        {client.status === 'active' ? (
          <Button variant="danger" onClick={onDeactivate} loading={deactivateLoading}>
            Deactivate
          </Button>
        ) : (
          <Button variant="primary" onClick={onReactivate} loading={reactivateLoading}>
            Reactivate
          </Button>
        )}
        <Button variant="secondary" onClick={onEdit}>
          Edit
        </Button>
      </div>
    </div>
  );
}
