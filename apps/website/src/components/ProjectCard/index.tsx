import { useColorMode } from "@docusaurus/theme-common";

import IconDiscord from "../../icons/IconDiscord";
import IconGithub from "../../icons/IconGithub";
import IconWebsite from "../../icons/IconWebsite";

import styles from "./styles.module.css";

interface ProjectLinks {
  website?: string;
  github?: string;
  discord?: string;
}

interface ProjectCardProps {
  name: string;
  description: string;
  hackathon?: string;
  status?: string;
  links: ProjectLinks;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  description,
  hackathon = "",
  links,
  name,
  status = "",
}: ProjectCardProps) => {
  const categories = hackathon ? [hackathon] : [status];
  const { colorMode } = useColorMode();

  return (
    <div className={`${styles.card} ${styles[colorMode]}`}>
      <div className={styles.cardTags}>
        {categories.map((category) => (
          <span key={category} className={styles.tag}>
            {category}
          </span>
        ))}
      </div>

      <div className={styles.cardBody}>
        <h2 className={styles.cardTitle}>{name}</h2>

        <p className={styles.cardDescription}>{description}</p>
      </div>

      {(links.website || links.github || links.discord) && (
        <div className={styles.cardFooter}>
          {links.github && (
            <a aria-label="GitHub" href={links.github} rel="noopener noreferrer" target="_blank">
              <IconGithub />
            </a>
          )}

          {links.website && (
            <a aria-label="Website" href={links.website} rel="noopener noreferrer" target="_blank">
              <IconWebsite />
            </a>
          )}

          {links.discord && (
            <a aria-label="Discord" href={links.discord} rel="noopener noreferrer" target="_blank">
              <IconDiscord />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectCard;
