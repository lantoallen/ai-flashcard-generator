import type { Metadata } from "next";
import CommunityScreen from "@/components/CommunityScreen";

export const metadata: Metadata = {
  title: "Community",
  description: "Discover study sets shared by other learners, and share your own.",
};

export default function CommunityPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <CommunityScreen />
    </div>
  );
}
