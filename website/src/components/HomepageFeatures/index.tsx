import { useColorMode } from "@docusaurus/theme-common";
import Heading from "@theme/Heading";
import clsx from "clsx";

import boxImage from "../../../static/img/box.png";
import boxDarkImage from "../../../static/img/box_dark.png";
import chainImage from "../../../static/img/chain.png";
import chainDarkImage from "../../../static/img/chain_dark.png";
import chartImage from "../../../static/img/chart.png";
import chartDarkImage from "../../../static/img/chart_dark.png";

import styles from "./styles.module.css";

interface FeatureItem {
  title: string;
  img: string;
  imgDark: string;
  description: JSX.Element;
}

const FeatureList: FeatureItem[] = [
  {
    title: "Highly secure",
    img: boxImage as string,
    imgDark: boxDarkImage as string,
    description: (
      <>
        MACI was designed to be a secure voting system. It is built using smart contracts on the Ethereum blockchain,
        which ensures votes cannot be faked, censored, or tampered with.
      </>
    ),
  },
  {
    title: "Protects privacy",
    img: chainImage as string,
    imgDark: chainDarkImage as string,
    description: (
      <>
        With MACI, votes are encrypted before submitting them on-chain to ensure that your privacy is preserved when
        participating in a vote.
      </>
    ),
  },
  {
    title: "Powered by zk-SNARKs",
    img: chartImage as string,
    imgDark: chartDarkImage as string,
    description: (
      <>
        MACI is powered by zk-SNARKs, a cutting edge cryptographic technology that ensures votes are counted correctly
        without revealing the individual votes.
      </>
    ),
  },
];

const Feature = ({ title, img, imgDark, description }: FeatureItem) => {
  const { isDarkTheme } = useColorMode();

  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <img alt={title} className={styles.featureImg} src={isDarkTheme ? imgDark : img} />
      </div>

      <div className="text--center padding-horiz--md">
        <Heading as="h3" className={styles.featureTitle}>
          {title}
        </Heading>

        <p>{description}</p>
      </div>
    </div>
  );
};

const HomepageFeatures = (): JSX.Element => (
  <section className={styles.features}>
    <div className="container">
      <div className="row">
        {FeatureList.map((data) => (
          <Feature key={data.title} {...data} />
        ))}
      </div>
    </div>
  </section>
);

export default HomepageFeatures;
