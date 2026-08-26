import type { Weapon } from "@/features/arsenal";

import AudioPlayer from "./AudioPlayer";
import css from "./GuideSection.module.css";

import guideImage from "@/assets/images/guide.webp";

type GuideSectionProps = {
  weapon: Weapon | null;
};

const GuideSection = ({ weapon }: GuideSectionProps) => {
  return (
    <>
      <div className={css.container}>
        <div className={css.guideImageWrapper}>
          <div className={css.guideGradient} />
          <img src={guideImage} alt="Guide image" className={css.guideImage} />
        </div>
        <div className={css.content}>
          <p className={css.title}>[ Голосовий гід ]</p>
          <p className={css.description}>
            Розказує про модель <br />
            <span>{weapon?.name ?? ""}</span>
          </p>
          <AudioPlayer className={css.audioPlayer} src={weapon?.audioUrl} />
        </div>
      </div>
    </>
  );
};

export default GuideSection;
