import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import Layout from "@theme/Layout";
import clsx from "clsx";

import HomepageFeatures from "../components/HomepageFeatures";

import styles from "./index.module.css";

interface HomepageHeaderProps {
  tagline: string;
  title: string;
}

const HomepageHeader = ({ tagline, title }: HomepageHeaderProps) => (
  <header className={clsx("hero hero--dark", styles.heroBanner)}>
    <div className={styles.heroTitle}>{title}</div>

    <div className={styles.heroTagline}>
      {tagline}

      <span className={styles.blue}>.</span>
    </div>
  </header>
);

const Home = (): JSX.Element => {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout
      description="Minimal Anti-Collusion Infrastructure (MACI) is an on-chain voting platform which protects privacy and minimizes the risk of collusion and bribery"
      title={`Minimal Anti-Collusion Infrastructure (${siteConfig.title})`}
    >
      <HomepageHeader tagline={siteConfig.tagline} title={siteConfig.title} />

      <main>
        <section className={styles.introduction}>
          <div className="container">
            <h2 className={styles.borderBlue}>What is MACI?</h2>

            <p>Minimal Anti-Collusion Infrastructure (MACI) is a private, on-chain, voting system.</p>

            <p>
              MACI is our attempt to build the most secure e-voting solution available. It enables on-chain voting
              processes with significantly reduced risk of cheating, like bribery or collusion, through the use of
              Ethereum smart contracts, encryption, and zero-knowledge proofs. Together these technologies provide a set
              of guarantees including censorship resistance, correct execution, privacy, and a receipt-free voting
              scheme, which ensures results are transparent but makes it impossible for outsiders to verify how any
              specific user voted. We believe MACI is most beneficial for governance and funding events, when the stakes
              are high and anti-collusion mechanisms are critical to help ensure fair and transparent outcomes.
            </p>
          </div>
        </section>

        <HomepageFeatures />
      </main>
    </Layout>
  );
};

export default Home;
