"use client";

import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorState } from "../hooks/useEditorState";

/**
 * Cienki przycisk „Dodaj tekst". Edycja zaznaczonego tekstu znajduje się
 * w `SelectionControls` (działa też dla obrazków).
 */
export function TextControls() {
  const addText = useEditorState((s) => s.addText);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => addText({})}
      className="w-full justify-start"
    >
      <Type className="h-4 w-4" />
      Dodaj tekst
    </Button>
  );
}
