import type { Metadata } from "next";
import SandboxPreviewPage from "@/features/templates/sandbox-preview-page";

export const metadata: Metadata = {
  title: "Isolated template preview",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SandboxPreviewPage />;
}
