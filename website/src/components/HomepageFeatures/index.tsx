import Heading from "@theme/Heading";
import clsx from "clsx";

import mountainSvgImage from "../../../static/img/undraw_docusaurus_mountain.svg";
import reactSvgImage from "../../../static/img/undraw_docusaurus_react.svg";
import treeSvgImage from "../../../static/img/undraw_docusaurus_tree.svg";

import styles from "./styles.module.css";

interface FeatureItem {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<"svg">>;
  description: JSX.Element;
}

const FeatureList: FeatureItem[] = [
  {
    title: "Highly secure",
    Svg: mountainSvgImage,
    description: (
      <>
        MACI was designed to be a secure voting system. It is built using smart contracts on the Ethereum blockchain,
        which ensures votes cannot be faked, censored, or tampered with.
      </>
    ),
  },
  {
    title: "Protects privacy",
    Svg: treeSvgImage,
    description: (
      <>
        With MACI, votes are encrypted before submitting them on-chain to ensure that your privacy is preserved when
        participating in a vote.
      </>
    ),
  },
  {
    title: "Powered by zk-SNARKs",
    Svg: reactSvgImage,
    description: (
      <>
        MACI is powered by zk-SNARKs, a cutting edge cryptographic technology that ensures votes are counted correctly
        without revealing the individual votes.
      </>
    ),
  },
];

const Feature = ({ title, Svg, description }: FeatureItem) => (
  <div className={clsx("col col--4")}>
    <div className="text--center">
      <Svg className={styles.featureSvg} role="img" />
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
