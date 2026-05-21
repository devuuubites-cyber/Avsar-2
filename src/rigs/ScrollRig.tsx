import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import Lenis from "lenis";

type ScrollState = {
  progress: number;
};

const ScrollContext = createContext<{
  state: ScrollState;
  lenis: Lenis | null;
}>({
  state: { progress: 0 },
  lenis: null,
});

export function ScrollRig({ children }: { children: ReactNode }) {
  const stateRef = useRef<ScrollState>({ progress: 0 });
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.4,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    const onScroll = () => {
      stateRef.current.progress = lenis.progress;
    };
    lenis.on("scroll", onScroll);

    let rafId = 0;
    const tick = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  const value = useMemo(
    () => ({ state: stateRef.current, lenis: lenisRef.current }),
    [],
  );

  return <ScrollContext.Provider value={value}>{children}</ScrollContext.Provider>;
}

/** Returns the live scroll-progress ref (0..1). Mutated each frame by Lenis. */
export function useScrollState() {
  return useContext(ScrollContext).state;
}
