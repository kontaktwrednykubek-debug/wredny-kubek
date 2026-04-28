"use client";

import { Type, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorState } from "../hooks/useEditorState";

export function TextControls() {
  const { addText, selectedId, elements, updateElement, removeElement } =
    useEditorState();
  const selected = elements.find((e) => e.id === selectedId);
  const selectedText = selected?.kind === "text" ? selected : null;

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={() => addText({})}
        className="w-full justify-start"
      >
        <Type className="h-4 w-4" />
        Dodaj tekst
      </Button>

      {selectedText && (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <input
            value={selectedText.text}
            onChange={(e) =>
              updateElement(selectedText.id, { text: e.target.value })
            }
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={8}
              max={200}
              value={selectedText.fontSize}
              onChange={(e) =>
                updateElement(selectedText.id, {
                  fontSize: Number(e.target.value),
                })
              }
              className="w-20 rounded-lg border border-input bg-background px-2 py-1 text-sm"
            />
            <input
              type="color"
              value={selectedText.fill}
              onChange={(e) =>
                updateElement(selectedText.id, { fill: e.target.value })
              }
              className="h-8 w-8 cursor-pointer rounded"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeElement(selectedText.id)}
              aria-label="Usuń"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
