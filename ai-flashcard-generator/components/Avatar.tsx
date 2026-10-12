import { avatarColor, initialOf, type PublicProfile } from '@/lib/social';

const SIZES = { xs: 28, sm: 36, md: 48, lg: 72, xl: 112 } as const;

/** A profile picture, or a coloured circle with the person's initial. */
export default function Avatar({
  person,
  size = 'md',
  className = '',
}: {
  person: Pick<PublicProfile, 'avatar' | 'avatarColor' | 'displayName' | 'username'>;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const px = SIZES[size];
  const base = `shrink-0 rounded-full border-2 border-ink ${className}`;

  if (person.avatar) {
    return (
      // A small inline data URL, so a plain <img> is the right tool here.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={person.avatar}
        alt=""
        width={px}
        height={px}
        className={`${base} object-cover`}
        style={{ width: px, height: px }}
      />
    );
  }

  const c = avatarColor(person.avatarColor);
  return (
    <span
      aria-hidden="true"
      className={`${base} flex items-center justify-center font-display font-extrabold`}
      style={{
        width: px,
        height: px,
        background: c.bg,
        color: c.fg,
        fontSize: Math.round(px * 0.42),
      }}
    >
      {initialOf(person)}
    </span>
  );
}
