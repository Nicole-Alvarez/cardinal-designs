import TemplateEditorPage from "@/features/templates/[id]/template-editor-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TemplateEditorPage templateId={id} />;
}
