import Heading from "@theme/Heading";
import clsx from "clsx";

import boxImage from "../../../static/img/box.png";
import chainImage from "../../../static/img/chain.png";
import chartImage from "../../../static/img/chart.png";

import styles from "./styles.module.css";

interface FeatureItem {
  title: string;
  img: string;
  description: JSX.Element;
}

const FeatureList: FeatureItem[] = [
  {
    title: "Highly secure",
    img: boxImage as string,
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
    description: (
      <>
        MACI is powered by zk-SNARKs, a cutting edge cryptographic technology that ensures votes are counted correctly
        without revealing the individual votes.
      </>
    ),
  },
];

const Feature = ({ title, img, description }: FeatureItem) => (
  <div className={clsx("col col--4")}>
    <div className="text--center">
      <img alt={title} className={styles.featureSvg} src={img} />
    </div>

    <div className="text--center padding-horiz--md">
      <Heading as="h3">{title}</Heading>

      <p>{description}</p>
    </div>
  </div>
);

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
