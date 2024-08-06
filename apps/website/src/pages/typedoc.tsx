import Layout from "@theme/Layout";

const TypedocPage = (): JSX.Element => (
  <Layout description="Description for your Typedoc page" title="Typedoc">
    <iframe src="/typedoc_output/index.html" style={{ width: "100%", height: "100vh" }} title="typedoc" />
  </Layout>
);

export default TypedocPage;
