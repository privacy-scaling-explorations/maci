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
              MACI is a protocol designed to provide a highly secure e-voting solution. It enables organizations to
              conduct on-chain voting processes with a significantly reduced risk of cheating, such as bribery or
              collusion. MACI uses zero-knowledge proofs to implement a receipt-free voting scheme, making it
              coordinator to verify how a specific user voted. This ensures the correct execution of votes and allows
              anyone to verify the results. It is particularly beneficial for governance and funding events, where its
              anti-collusion mechanisms help ensure fair and transparent outcomes.
            </p>
          </div>
        </section>

        <HomepageFeatures />
      </main>
    </Layout>
  );
};

export default Home;
