import type { Metadata } from "next";
import Messenger from "@/components/Messenger";

export const metadata: Metadata = {
  title: "Messages",
};

export default function ThreadPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Messenger />
    </div>
  );
}
