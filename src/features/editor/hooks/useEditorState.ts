"use client";

import { create } from "zustand";
import type { ProductId } from "@/config/products";
import type { DesignElement, ImageElement, TextElement } from "../types";

type State = {
  productId: ProductId;
  elements: DesignElement[];
  selectedId: string | null;
  mirror: boolean;
  /** Id istniejącego projektu w bazie — jeśli ustawione, zapis aktualizuje (a nie duplikuje). */
  currentDesignId: string | null;
};

type Actions = {
  setProduct: (id: ProductId) => void;
  addText: (t: Partial<TextElement>) => void;
  addImage: (src: string) => void;
  updateElement: (id: string, patch: Partial<DesignElement>) => void;
  removeElement: (id: string) => void;
  select: (id: string | null) => void;
  toggleMirror: () => void;
  /** Załaduj projekt z bazy do stanu edytora. */
  loadDesign: (input: {
    id: string;
    productId: ProductId;
    elements: DesignElement[];
    mirror?: boolean;
  }) => void;
  /** Zresetuj edytor do pustego stanu (np. nowy projekt). */
  reset: () => void;
};

const uid = () => Math.random().toString(36).slice(2, 9);

export const useEditorState = create<State & Actions>((set) => ({
  productId: "mug",
  elements: [],
  selectedId: null,
  mirror: false,
  currentDesignId: null,

  setProduct: (id) =>
    set({ productId: id, elements: [], selectedId: null, currentDesignId: null }),

  loadDesign: ({ id, productId, elements, mirror }) =>
    set({
      currentDesignId: id,
      productId,
      elements,
      mirror: mirror ?? false,
      selectedId: null,
    }),

  reset: () =>
    set({
      productId: "mug",
      elements: [],
      selectedId: null,
      mirror: false,
      currentDesignId: null,
    }),

  addText: (t) => {
    const id = uid();
    set((s) => ({
      selectedId: id,
      elements: [
        ...s.elements,
        {
          id,
          kind: "text",
          x: 60,
          y: 60,
          text: "Twój napis",
          fontSize: 36,
          fontFamily: "Inter",
          fill: "#1a1a1a",
          rotation: 0,
          ...t,
        } as TextElement,
      ],
    }));
  },

  addImage: (src) => {
    const id = uid();
    set((s) => ({
      selectedId: id,
      elements: [
        ...s.elements,
        {
          id,
          kind: "image",
          x: 40,
          y: 40,
          width: 160,
          height: 160,
          src,
          rotation: 0,
        } as ImageElement,
      ],
    }));
  },

  updateElement: (id, patch) =>
    set((s) => ({
      elements: s.elements.map((e) =>
        e.id === id ? ({ ...e, ...patch } as DesignElement) : e,
      ),
    })),

  removeElement: (id) =>
    set((s) => ({
      elements: s.elements.filter((e) => e.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  select: (id) => set({ selectedId: id }),
  toggleMirror: () => set((s) => ({ mirror: !s.mirror })),
}));
