'use client';

import { useRouter } from 'next/navigation';
import { Icon } from './icons';
import { createDemoSet } from '@/lib/demo';
import { getSets, saveSet } from '@/lib/storage';

/** Opens the built-in demo set (saved once), so people can try Flashly without the AI. */
export default function DemoButton({
  className = 'btn btn-secondary btn-lg',
  label = 'Try a demo set',
}: {
  className?: string;
  label?: string;
}) {
  const router = useRouter();

  function openDemo() {
    const existing = getSets().find((s) => s.source === 'demo');
    if (existing) {
      router.push(`/study/${existing.id}`);
      return;
    }
    const demo = createDemoSet();
    saveSet(demo);
    router.push(`/study/${demo.id}`);
  }

  return (
    <button type="button" onClick={openDemo} className={className}>
      <Icon name="layers" />
      {label}
    </button>
  );
}
