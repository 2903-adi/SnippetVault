import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { fetchSnippet } from "../api.js";

function formatExpiry(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ViewSnippet() {
  const { shortId } = useParams();
  const [snippet, setSnippet] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await fetchSnippet(shortId);
        if (active) setSnippet(data);
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
  }, [shortId]);

  async function copyCode() {
    if (!snippet) return;
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <Layout compact>
      {loading ? <p className="status-line">Loading snippet...</p> : null}

      {!loading && error ? (
        <section className="panel">
          <p className="eyebrow">Unavailable</p>
          <h1 className="panel-title">Snippet missing</h1>
          <p className="panel-copy">{error}</p>
          <Link className="btn btn-primary" to="/">
            Create a new snippet
          </Link>
        </section>
      ) : null}

      {!loading && snippet ? (
        <section className="viewer">
          <div className="viewer-header">
            <div>
              <p className="eyebrow">{snippet.language}</p>
              <h1 className="viewer-title">{snippet.title}</h1>
              <p className="meta">
                {snippet.visibility || "public"} · Expires {formatExpiry(snippet.expireAt)} · ID{" "}
                {snippet.shortId}
                {snippet.author?.name ? ` · ${snippet.author.name}` : ""}
              </p>
            </div>
            <button type="button" className="btn btn-secondary" onClick={copyCode}>
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
          <pre className="code-block">
            <code>{snippet.code}</code>
          </pre>
        </section>
      ) : null}
    </Layout>
  );
}
