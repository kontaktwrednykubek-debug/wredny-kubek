"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEditorState } from "../hooks/useEditorState";

export function AssetUploader() {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const addImage = useEditorState((s) => s.addImage);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") addImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        className="w-full justify-start"
      >
        <Upload className="h-4 w-4" />
        Wgraj zdjęcie
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}
