import { ScrollRig } from "./rigs/ScrollRig";
import { OceanScene } from "./scenes/OceanScene";
import { Overlay } from "./ui/Overlay";
import { CreditPill } from "./ui/CreditPill";

export default function App() {
  return (
    <ScrollRig>
      <div className="canvas-fixed">
        <OceanScene />
      </div>
      <Overlay />
      <div className="scroll-surface" aria-hidden />
      <CreditPill />
    </ScrollRig>
  );
}
