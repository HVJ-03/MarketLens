/* Kage entry from ThreeUI's src/shaders/landing-pages/LandingPages.tsx (registered
   SHA-256 4d379461…), with the other pages in that file left out. */
import {
  splitTypographyProps,
  usePageTypography,
  type PageTypographyProps,
} from "./pageTypography";
import { LandingPageFrame, type LandingPageProps } from "./LandingPageFrame";
export { LandingPageFrame, applyBackgroundPresentation } from "./LandingPageFrame";
export type { LandingPageFrameProps, LandingPageProps } from "./LandingPageFrame";
import { KAGE_TYPOGRAPHY } from "./kageRecipe";

export function KageLandingPage(props: LandingPageProps & PageTypographyProps) {
  const [type, frame] = splitTypographyProps(props);
  const customization = usePageTypography(KAGE_TYPOGRAPHY, type);
  return <LandingPageFrame {...frame} customization={customization} title="Kage — Where stillness reveals the unseen" sourceUrl="/landing-pages/kage.html" />;
}

/* MarketLens's copy of the Kage document (public/landing-pages/marketlens.html):
   same scene, styles and script, with the copy, the four-letter wordmark and the
   calls to action rewritten for the product. Takes the Kage controls unchanged. */
export function MarketLensLandingPage(props: LandingPageProps & PageTypographyProps) {
  const [type, frame] = splitTypographyProps(props);
  const customization = usePageTypography(KAGE_TYPOGRAPHY, type);
  return <LandingPageFrame {...frame} customization={customization} title="MarketLens — See the market before you enter it" sourceUrl="/landing-pages/marketlens.html" />;
}
