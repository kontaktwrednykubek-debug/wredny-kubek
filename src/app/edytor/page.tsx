import { Suspense } from "react";
import { EditorContainer } from "@/features/editor/EditorContainer";

export const metadata = { title: "Edytor projektu" };

export default function EditorPage() {
  return (
    <Suspense fallback={null}>
      <EditorContainer />
    </Suspense>
  );
}
