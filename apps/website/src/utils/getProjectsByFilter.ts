import type Projects from "../content/projects.json";

/**
 * Filters projects based on hackathon and status criteria.
 * @param projects An array of objects where each object represents a project.
 * @param filter An object containing optional hackathon and status filter criteria.
 * @returns An array of projects that match the given filter criteria.
 */
export function getProjectsByFilter(
  projects: typeof Projects,
  filter: { hackathon?: string; status?: string },
): typeof Projects {
  return projects.filter((project) => {
    const hackathonMatch = !filter.hackathon || project.hackathon === filter.hackathon;
    const statusMatch = !filter.status || project.status === filter.status;
    return hackathonMatch && statusMatch;
  });
}

/**
 * Extracts unique hackathons from the projects list.
 * @param projects An array of objects where each object represents a project.
 * @returns An array of strings, where each string is a unique hackathon from across all projects.
 */
export function getUniqueHackathons(projects: typeof Projects): string[] {
  const hackathons = projects
    .map((project) => project.hackathon)
    .filter((hackathon): hackathon is string => hackathon !== null && hackathon !== "");
  return Array.from(new Set(hackathons));
}

/**
 * Extracts unique statuses from the projects list.
 * @param projects An array of objects where each object represents a project.
 * @returns An array of strings, where each string is a unique status from across all projects.
 */
export function getUniqueStatuses(projects: typeof Projects): string[] {
  const statuses = projects.map((project) => project.status);
  return Array.from(new Set(statuses));
}
