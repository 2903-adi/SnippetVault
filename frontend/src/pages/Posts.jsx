import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { fetchMySnippets, fetchPublicSnippets } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatDate(dateString) {
  return new Date(dateString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function Posts() {
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState("public");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        if (tab === "mine") {
          if (!isAuthenticated) {
            if (active) {
              setItems([]);
              setError("Log in to see your private and public posts.");
            }
            return;
          }
          const data = await fetchMySnippets();
          if (active) setItems(data.items || []);
        } else {
          const data = await fetchPublicSnippets(1);
          if (active) setItems(data.items || []);
        }
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [tab, isAuthenticated]);

  return (
    <Layout compact>
      <section className="hero hero-compact">
        <h1 className="brand-hero brand-hero-sm">Posts</h1>
        <p className="hero-line">Public snippets from the vault. Private ones stay off this feed.</p>
      </section>

      <div className="tabs">
        <button
          type="button"
          className={tab === "public" ? "tab active" : "tab"}
          onClick={() => setTab("public")}
        >
          Public
        </button>
        <button
          type="button"
          className={tab === "mine" ? "tab active" : "tab"}
          onClick={() => setTab("mine")}
        >
          Mine
        </button>
      </div>

      {loading ? <p className="status-line">Loading posts...</p> : null}
      {!loading && error ? <p className="form-error">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <section className="panel">
          <p className="eyebrow">Empty</p>
          <h2 className="panel-title">No posts yet</h2>
          <p className="panel-copy">
            {tab === "mine"
              ? "Create a snippet and it will show up here."
              : "Be the first to share a public snippet."}
          </p>
          <Link className="btn btn-primary" to="/">
            Create snippet
          </Link>
        </section>
      ) : null}

      <div className="posts-list">
        {items.map((post) => (
          <Link key={post.shortId} to={`/s/${post.shortId}`} className="post-row">
            <div className="post-main">
              <p className="eyebrow">
                {post.language}
                {post.visibility === "private" ? " · private" : ""}
                {post.author?.name ? ` · ${post.author.name}` : ""}
              </p>
              <h2 className="post-title">{post.title}</h2>
              <pre className="post-preview">{post.preview}</pre>
            </div>
            <p className="meta">{formatDate(post.createdAt)}</p>
          </Link>
        ))}
      </div>
    </Layout>
  );
}
