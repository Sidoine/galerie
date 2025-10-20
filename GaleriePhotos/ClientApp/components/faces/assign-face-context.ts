import { createContext, useContext } from "react";
import { Face } from "@/services/views";

export interface AssignFaceContextValue {
  assign: (face: Face, name: string) => Promise<boolean>;
}

export const AssignFaceContext = createContext<AssignFaceContextValue | null>(
  null
);

export function useAssignFace(): AssignFaceContextValue {
  const ctx = useContext(AssignFaceContext);
  if (!ctx) throw new Error("AssignFaceContext non fourni");
  return ctx;
}
