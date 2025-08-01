import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";

import type * as Preset from "@docusaurus/preset-classic";
import type { Config } from "@docusaurus/types";

import { loadContent } from "./src/plugins/blog-plugin/index";

const GITHUB_URL = "https://github.com/privacy-scaling-explorations/maci";

async function getConfig(): Promise<Config> {
  const blogPosts = await loadContent();

  const config: Config = {
    title: "MACI",
    tagline: "Minimal Anti-Collusion Infrastructure",
    favicon: "img/favicon.ico",

    // Set the production url of your site here
    url: "https://maci.pse.dev",
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: "/",

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: "privacy-scaling-explorations", // Usually your GitHub org/user name.
    projectName: "maci", // Usually your repo name.

    onBrokenLinks: "warn",
    onBrokenMarkdownLinks: "warn",

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
      defaultLocale: "en",
      locales: ["en"],
    },

    presets: [
      [
        "classic",
        {
          docs: {
            routeBasePath: "docs/",
            sidebarPath: "./sidebars.ts",
            editUrl: ({ versionDocsDirPath, docPath }) =>
              `${GITHUB_URL}/edit/dev/apps/website/${versionDocsDirPath}/${docPath}`,
            remarkPlugins: [remarkMath],
            rehypePlugins: [rehypeKatex],
            includeCurrentVersion: false,
            versions: {
              "v1.2": {
                banner: "none",
              },
            },
          },
          blog: {
            showReadingTime: true,

            editUrl: ({ blogDirPath, blogPath }) => `${GITHUB_URL}/edit/dev/apps/website/${blogDirPath}/${blogPath}`,
            remarkPlugins: [remarkMath],
            rehypePlugins: [rehypeKatex],
            onUntruncatedBlogPosts: "ignore",
          },
          theme: {
            customCss: "./src/css/custom.css",
          },
        } satisfies Preset.Options,
      ],
    ],

    plugins: [
      [
        "@easyops-cn/docusaurus-search-local",
        {
          hashed: true,
          language: ["en"],
          // If the `indexDocs` is set to `true`, Docusaurus will index docs.
          // If the `indexBlog` is set to `true`, Docusaurus will index blogs.
          indexDocs: true,
          indexBlog: true,
          // If the `indexPages` is set to `true`, Docusaurus will index pages.
          indexPages: true,
          // // Docs route base path, default to '/docs'.
          // docsRouteBasePath: '/docs',
          // Blog route base path, default to '/blog'.
          blogRouteBasePath: "/blog",
        },
      ],
      "docusaurus-plugin-image-zoom",
      "docusaurus-plugin-matomo",
    ],
    stylesheets: [
      {
        href: "https://cdn.jsdelivr.net/npm/katex@0.13.24/dist/katex.min.css",
        type: "text/css",
        integrity: "sha384-odtC+0UGzzFL/6PNoE8rX/SPcQDXBJ+uRepguP4QkPCm2LBxH3FA3y+fKSiJ+AmM",
        crossorigin: "anonymous",
      },
    ],
    customFields: {
      blogPosts: Array.isArray(blogPosts) ? blogPosts : [],
    },
    themeConfig: {
      prism: {
        additionalLanguages: ["bash"],
      },
      image: "img/maci-card.png",
      navbar: {
        title: "MACI",
        items: [
          {
            label: "Documentation",
            href: "/docs/introduction",
            position: "left",
          },
          {
            to: "/blogs",
            label: "Blog",
          },
          {
            to: "/roadmap",
            label: "Roadmap",
            position: "left",
          },
          {
            to: "/projects",
            label: "Projects",
            position: "left",
          },
          {
            type: "docsVersionDropdown",
            position: "right",
            dropdownActiveClassDisabled: true,
            // TODO: add /versions page to explain major versions & link to blog posts
            // dropdownItemsAfter: [
            //   {
            //     type: 'html',
            //     value: '<hr class="dropdown-separator">',
            //   },
            //   {
            //     to: '/versions',
            //     label: 'All versions',
            //   },
            // ],
          },
          {
            type: "search",
            position: "right",
          },
          {
            href: GITHUB_URL,
            label: "GitHub",
            position: "right",
          },
        ],
      },
      footer: {
        links: [
          {
            title: "Docs",
            items: [
              {
                label: "Documentation",
                to: "/docs/introduction",
              },
              {
                label: "GitHub",
                href: GITHUB_URL,
              },
            ],
          },
          {
            title: "Community",
            items: [
              {
                label: "Discord",
                href: "https://discord.com/invite/sF5CT5rzrR",
              },
              {
                label: "Twitter",
                href: "https://twitter.com/zkMACI",
              },
            ],
          },
          {
            title: "More",
            items: [
              {
                label: "Blog",
                to: "/blog",
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear().toString()} Privacy and Scaling Explorations`,
      },
      zoom: {},
      matomo: {
        matomoUrl: "https://psedev.matomo.cloud/",
        siteId: "18",
        phpLoader: "matomo.php",
        jsLoader: "matomo.js",
      },
      mermaid: {
        theme: { light: "neutral", dark: "forest" },
      },
    } satisfies Preset.ThemeConfig,
    markdown: {
      mermaid: true,
    },
    themes: ["@docusaurus/theme-mermaid"],
  };
  return config;
}

export default getConfig();
