import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useScrollState } from "../rigs/ScrollRig";

/** Read the current scroll progress (0..1) into a ref each frame. */
export function useScrollProgress() {
  const state = useScrollState();
  const ref = useRef(0);
  useFrame(() => {
    ref.current = state.progress;
  });
  return ref;
}
