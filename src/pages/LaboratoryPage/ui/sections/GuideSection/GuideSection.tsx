import AudioPlayer from "./AudioPlayer";
import css from "./GuideSection.module.css";

import guideImage from "@/assets/images/guide.webp";

const GuideSection = () => {
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
            <span>П. Макарова</span>
          </p>
          <AudioPlayer className={css.audioPlayer} />
        </div>
      </div>
    </>
  );
};

export default GuideSection;
