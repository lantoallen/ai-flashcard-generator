import type { Metadata } from "next";
import ProfileView from "@/components/ProfileView";

export const metadata: Metadata = {
  title: "Profile",
};

export default function UserPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
      <ProfileView />
    </div>
  );
}
