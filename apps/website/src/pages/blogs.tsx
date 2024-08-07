import React from "react";
import Layout from "@theme/Layout";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import styles from "../css/card.module.css";

interface BlogPost {
  title: string;
  date: string;
  slug: string;
  description: string;
  authorName: string;
  tags: string[];
  excerpt: string;
}

/**
 * Renders a list of blog posts.
 *
 * @returns {JSX.Element} The rendered blog page.
 */
const BlogPage: React.FC = () => {
  const { siteConfig } = useDocusaurusContext();
  const blogPosts: BlogPost[] = (siteConfig.customFields?.blogPosts ?? []) as BlogPost[];

  if (blogPosts.length === 0) {
    return <div>No blog posts available.</div>;
  }

  return (
    <Layout title="Blog">
      <div className={styles.blogContainer}>
        <div className={styles.blogList}>
          {blogPosts.map((post: BlogPost) => (
            <a key={post.slug} className={styles.blogCard} href={`/blog/${post.slug}`}>
              <h2 className={styles.blogTitle}>{post.title}</h2>
              <p className={styles.blogDescription}>{post.description}</p>
              <p className={styles.blogDate}>{post.date}</p>
              <p className={styles.blogAuthors}>By {post.authorName}</p>
              <p className={styles.blogExcerpt}>{post.excerpt}</p> {/* Display excerpt */}
              <span className={styles.blogReadMoreButton}>Read More</span>
            </a>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default BlogPage;
