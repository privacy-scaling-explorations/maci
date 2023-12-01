import React from "react";
import Layout from "@theme/Layout";

const TypedocPage = () => {
  return (
    <Layout title="Typedoc" description="Description for your Typedoc page">
      <iframe src="/typedoc_output/index.html" style={{ width: "100%", height: "100vh" }} />
    </Layout>
  );
};

export default TypedocPage;
