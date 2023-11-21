import clsx from 'clsx';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Logo from "../../static/img/maci.svg";
import styles from './index.module.css';
 
function HomepageHeader() {
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Logo width="50%" height="50%" />
      </div>
    </header>
  );
}

export default function Home(): JSX.Element {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />">
      <HomepageHeader />
      <main>
        <section className={styles.introduction}>
          <div className="container">
            <div>
              <h1>What is MACI?</h1>
              <p>Minimal Anti-Collusion Infrastructure (MACI) is a private, on-chain, voting system.</p>
              <p>MACI is a protocol designed to provide a highly secure e-voting solution. It enables organizations to conduct on-chain voting processes with a significantly reduced risk of cheating, such as bribery or collusion. MACI uses zero-knowledge proofs to implement a receipt-free voting scheme, making it impossible for anyone other than the vote coordinator to verify how a specific user voted. This ensures the correct execution of votes and allows anyone to verify the results. It's particularly beneficial for governance and funding events, where its anti-collusion mechanisms help ensure fair and transparent outcomes.</p>
            </div>
          </div>
        </section>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
