import type { Metadata } from "next";
import ProfileScreen from "@/components/ProfileScreen";

export const metadata: Metadata = {
  title: "My profile",
  description: "Edit your photo, username, interests and privacy settings.",
};

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <ProfileScreen />
    </div>
  );
}
