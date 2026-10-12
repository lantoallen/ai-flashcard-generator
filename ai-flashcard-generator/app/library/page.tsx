import type { Metadata } from "next";
import Link from "next/link";
import LibraryView from "@/components/LibraryView";
import { Icon } from "@/components/icons";

export const metadata: Metadata = {
  title: "My Library",
  description: "Your saved flashcard sets.",
};

export default function LibraryPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">My Library</h1>
          <p className="mt-2 text-muted">
            Saved in this browser. Use Backup to keep a copy.
          </p>
        </div>
        <Link href="/create" className="btn btn-primary">
          <Icon name="plus" size={16} />
          New set
        </Link>
      </div>
      <LibraryView />
    </div>
  );
}
