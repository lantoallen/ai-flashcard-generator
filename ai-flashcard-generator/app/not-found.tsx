import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 py-24 text-center">
      <p className="brand-text text-6xl font-bold">404</p>
      <h1 className="text-2xl font-semibold">We couldn’t find that page</h1>
      <p className="text-muted">
        The link may be broken, or the page may have moved.
      </p>
      <div className="mt-2 flex gap-3">
        <Link href="/" className="btn btn-primary">
          Go home
        </Link>
        <Link href="/library" className="btn btn-secondary">
          My library
        </Link>
      </div>
    </div>
  );
}
