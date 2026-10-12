import type { Metadata } from "next";
import SharedImport from "@/components/SharedImport";

export const metadata: Metadata = {
  title: "Shared set",
  description: "Add a flashcard set that someone shared with you.",
};

export default function SharedPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12 sm:px-6">
      <SharedImport />
    </div>
  );
}
