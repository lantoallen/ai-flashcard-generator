import type { Metadata } from "next";
import PeopleView from "@/components/PeopleView";

export const metadata: Metadata = {
  title: "Find people",
  description: "Meet learners who share your interests.",
};

export default function PeoplePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <PeopleView />
    </div>
  );
}
