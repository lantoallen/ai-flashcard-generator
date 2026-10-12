import type { Metadata } from "next";
import CreateForm from "@/components/CreateForm";

export const metadata: Metadata = {
  title: "Create a set",
  description: "Generate flashcards and quizzes from your notes or any topic.",
};

export default function CreatePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Create a study set</h1>
      <p className="mb-8 mt-3 text-muted">
        Paste your notes or name a topic and we’ll build the cards. You can edit
        everything afterwards.
      </p>
      <CreateForm />
    </div>
  );
}
