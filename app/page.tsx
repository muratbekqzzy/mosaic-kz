import { Intro } from "@/components/scenes/Intro";
import { Spiral } from "@/components/scenes/Spiral";
import { Stones } from "@/components/scenes/Stones";
import { Delivery } from "@/components/scenes/Delivery";
import { HowToOrder } from "@/components/scenes/HowToOrder";
import { Finale } from "@/components/scenes/Finale";
import { Stage } from "@/components/ui/Stage";
import { JsonLd, localBusinessLd } from "@/components/ui/JsonLd";
import { LangRemount } from "@/components/ui/LangRemount";

export default function Home() {
  return (
    <>
      <JsonLd data={localBusinessLd()} />
      <LangRemount>
        <main>
          <Intro />
          <Spiral />
          <Stones />
          <Delivery />
          <HowToOrder />
          <Finale />
          {/* last: stitches every scene above into one camera journey */}
          <Stage />
        </main>
      </LangRemount>
    </>
  );
}
