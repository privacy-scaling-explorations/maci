import { useColorMode } from "@docusaurus/theme-common";
import React, { useState, useEffect, useCallback } from "react";

import projects from "../../content/projects.json";
import { getProjectsByFilter, getUniqueHackathons, getUniqueStatuses } from "../../utils/getProjectsByFilter";
import ActionCard from "../ActionCard";
import ProjectCard from "../ProjectCard";

import styles from "./styles.module.css";

interface Project {
  name: string;
  description: string;
  hackathon: string | null;
  status: string;
  links: {
    website?: string;
    github?: string;
    discord?: string;
  };
}

const typedProjects = projects as unknown as Project[];

const sortedProjects = typedProjects.slice().sort((a, b) => a.name.localeCompare(b.name));

function chunkArray(array: Project[]): Project[][] {
  const result = [];
  for (let i = 0; i < array.length; i += 9) {
    const chunk = array.slice(i, i + 9);
    result.push(chunk);
  }
  return result.length === 0 ? [[]] : result;
}

const typedGetProjectsByFilter = getProjectsByFilter as (
  projects: Project[],
  filters: { hackathon: string; status: string },
) => Project[];
const typedGetUniqueHackathons = getUniqueHackathons as (projects: Project[]) => string[];
const typedGetUniqueStatuses = getUniqueStatuses as (projects: Project[]) => string[];

const ProjectList: React.FC = () => {
  const [filteredProjects, setFilteredProjects] = useState<Project[][]>(chunkArray(sortedProjects));
  const [selectedHackathon, setSelectedHackathon] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const { colorMode } = useColorMode();

  const filterProjects = useCallback(() => {
    const filtered = typedGetProjectsByFilter(sortedProjects, {
      hackathon: selectedHackathon,
      status: selectedStatus,
    });
    setFilteredProjects(chunkArray(filtered));
    setCurrentPage(0);
  }, [selectedHackathon, selectedStatus]);

  useEffect(() => {
    filterProjects();
  }, [filterProjects]);

  const hackathons = typedGetUniqueHackathons(sortedProjects);
  const statuses = typedGetUniqueStatuses(sortedProjects);

  return (
    <div className={`${styles.projectList} ${styles[colorMode]}`}>
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <h3>Status</h3>

          <div className={styles.filterOptions}>
            <button
              className={selectedStatus === "" ? styles.active : ""}
              type="button"
              onClick={() => {
                setSelectedStatus("");
              }}
            >
              All
            </button>

            {statuses.map((status) => (
              <button
                key={status}
                className={selectedStatus === status ? styles.active : ""}
                type="button"
                onClick={() => {
                  setSelectedStatus(status);
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.filterGroup}>
          <h3>Hackathon</h3>

          <div className={styles.filterOptions}>
            <button
              className={selectedHackathon === "" ? styles.active : ""}
              type="button"
              onClick={() => {
                setSelectedHackathon("");
              }}
            >
              All
            </button>

            {hackathons.map((hackathon) => (
              <button
                key={hackathon}
                className={selectedHackathon === hackathon ? styles.active : ""}
                type="button"
                onClick={() => {
                  setSelectedHackathon(hackathon);
                }}
              >
                {hackathon}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.projectsGrid}>
        {filteredProjects[currentPage]?.length > 0 ? (
          filteredProjects[currentPage].map((project) => (
            <ProjectCard
              key={project.name}
              description={project.description}
              hackathon={project.hackathon || undefined}
              links={project.links}
              name={project.name}
              status={project.status}
            />
          ))
        ) : (
          <div className={styles.noResults}>
            <p>
              <strong>No results found.</strong>
            </p>

            <p>No projects matching these filters. Try changing your search.</p>
          </div>
        )}
      </div>

      {filteredProjects.length > 1 && (
        <div className={styles.pagination}>
          <span
            className={`${styles.paginationArrow} ${currentPage === 0 ? styles.disabled : ""}`}
            onClick={() => {
              setCurrentPage((prev) => Math.max(0, prev - 1));
            }}
          >
            ←
          </span>

          {filteredProjects.map((_, index) => (
            <span
              key={index}
              className={`${styles.paginationNumber} ${currentPage === index ? styles.active : ""}`}
              onClick={() => {
                setCurrentPage(index);
              }}
            >
              {index + 1}
            </span>
          ))}

          <span
            className={`${styles.paginationArrow} ${currentPage === filteredProjects.length - 1 ? styles.disabled : ""}`}
            onClick={() => {
              setCurrentPage((prev) => Math.min(filteredProjects.length - 1, prev + 1));
            }}
          >
            →
          </span>
        </div>
      )}

      <div className={styles.actionCardContainer}>
        <ActionCard
          buttonText="Submit your project"
          buttonUrl="https://github.com/privacy-scaling-explorations/maci/issues/new?title=Add+a+Project+to+the+Projects+Showcase"
          description="We are missing your project! Add your project to this page and show your awesomeness to the world."
          title="Show what you have built"
        />
      </div>
    </div>
  );
};

export default ProjectList;
