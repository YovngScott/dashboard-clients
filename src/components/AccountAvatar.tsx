import { useState } from 'react';
import type { AccountIdentity } from '@/lib/account-identity';

export function AccountAvatar({ identity, className = '' }: { identity: AccountIdentity; className?: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const initials = identity.name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  const showImage = identity.avatarUrl && failedUrl !== identity.avatarUrl;

  return (
    <span aria-hidden="true" className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-teal-500 text-xs font-extrabold text-white ${className}`}>
      {showImage ? (
        <img
          src={identity.avatarUrl ?? undefined}
          alt=""
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(identity.avatarUrl)}
        />
      ) : initials || '?'}
    </span>
  );
}
