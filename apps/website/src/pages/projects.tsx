import Layout from "@theme/Layout";
import clsx from "clsx";

import ProjectsList from "../components/ProjectList";

import styles from "./index.module.css";

interface ProjectspageHeaderProps {
  tagline: string;
  title: string;
}

const ProjectspageHeader = ({ tagline, title }: ProjectspageHeaderProps) => (
  <header className={clsx("hero hero--dark", styles.heroBanner)}>
    <div className={styles.heroTitle}>{title}</div>

    <div className={styles.heroTagline}>
      {tagline}

      <span className={styles.blue}>.</span>
    </div>
  </header>
);

const Projects: React.FC = () => (
  <Layout description="A list of projects built with the MACI protocol" title="Projects built with MACI">
    <div>
      <ProjectspageHeader tagline="Explore the projects built by the MACI community" title="Projects" />
    </div>

    <main>
      <section className={styles.introduction}>
        <div className="container">
          <ProjectsList />
        </div>
      </section>
    </main>
  </Layout>
);

export default Projects;
