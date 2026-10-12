'use client';

import { useState } from 'react';
import Modal from './Modal';
import { useSocial } from './SocialProvider';
import { report } from '@/lib/community';
import { LIMITS } from '@/lib/social';

const REASONS = [
  'Spam or advertising',
  'Inappropriate or offensive',
  'Harassment or bullying',
  'Wrong or misleading content',
  'Something else',
];

export default function ReportDialog({
  kind,
  targetId,
  subject,
  onClose,
}: {
  kind: 'post' | 'user' | 'message';
  targetId: string;
  /** What is being reported, e.g. “this set” or “@maya”. */
  subject: string;
  onClose: () => void;
}) {
  const social = useSocial();
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!social.client || !social.userId || state === 'sending') return;
    setState('sending');
    try {
      const text = details.trim() ? `${reason}: ${details.trim()}` : reason;
      await report(social.client, social.userId, kind, targetId, text);
      setState('sent');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your report.');
      setState('error');
    }
  }

  return (
    <Modal title={`Report ${subject}`} onClose={onClose}>
      {state === 'sent' ? (
        <div className="flex flex-col items-start gap-4">
          <p className="font-semibold">
            Thank you. Your report was sent and helps keep the community friendly.
          </p>
          <button type="button" onClick={onClose} className="btn btn-primary">
            Done
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-bold">What’s the problem?</legend>
            {REASONS.map((r) => (
              <label key={r} className="flex cursor-pointer items-center gap-3 text-sm font-semibold">
                <input
                  type="radio"
                  name="reason"
                  checked={reason === r}
                  onChange={() => setReason(r)}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                {r}
              </label>
            ))}
          </fieldset>
          <div className="flex flex-col gap-2">
            <label htmlFor="report-details" className="text-sm font-bold">
              Anything else? <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="report-details"
              value={details}
              maxLength={LIMITS.report - 40}
              rows={3}
              onChange={(e) => setDetails(e.target.value)}
              className="input resize-y"
            />
          </div>
          {state === 'error' && (
            <p role="alert" className="text-sm font-semibold text-danger">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <button type="submit" disabled={state === 'sending'} className="btn btn-primary">
              {state === 'sending' ? 'Sending…' : 'Send report'}
            </button>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
