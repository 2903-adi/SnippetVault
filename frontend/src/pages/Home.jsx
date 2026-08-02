import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import Layout from "../components/Layout.jsx";
import { createSnippet } from "../api.js";
import { useAuth } from "../context/AuthContext.jsx";

const LANGUAGES = [
  "plaintext",
  "javascript",
  "typescript",
  "python",
  "java",
  "c",
  "cpp",
  "go",
  "rust",
  "html",
  "css",
  "sql",
  "bash",
  "json",
];

const EXPIRY_OPTIONS = [
  { value: "10m", label: "10 minutes" },
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
];

export default function Home() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();

  const [title, setTitle] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [expiresIn, setExpiresIn] = useState("1h");
  const [visibility, setVisibility] = useState("private");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!authLoading && !isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await createSnippet({
        title,
        language,
        expiresIn,
        visibility,
        code,
      });
      setCreated(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!created) return;
    const url = `${window.location.origin}/s/${created.shortId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function resetForm() {
    setCreated(null);
    setCopied(false);
    setTitle("");
    setCode("");
    setError("");
    setVisibility("private");
  }

  if (authLoading) {
    return (
      <Layout>
        <p className="status-line">Checking session...</p>
      </Layout>
    );
  }

  if (created) {
    const shareUrl = `${window.location.origin}/s/${created.shortId}`;

    return (
      <Layout compact>
        <section className="panel success-panel">
          <p className="eyebrow">
            {created.visibility === "public" ? "Public post" : "Private post"}
          </p>
          <h1 className="panel-title">Your snippet is live</h1>
          <p className="panel-copy">
            {created.visibility === "public"
              ? "It appears on the Posts page and can be opened with this link."
              : "It stays off the public feed. You can open it while logged in, or share this link."}
          </p>
          <div className="share-row">
            <code className="share-url">{shareUrl}</code>
            <button type="button" className="btn btn-secondary" onClick={copyLink}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <div className="action-row">
            <Link className="btn btn-primary" to={`/s/${created.shortId}`}>
              Open snippet
            </Link>
            <Link className="btn btn-ghost" to="/posts">
              View posts
            </Link>
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Create another
            </button>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="hero">
        <h1 className="brand-hero">SnippetVault</h1>
        <p className="hero-line">Temporary code sharing with self-destructing links.</p>
      </section>

      <form className="composer" onSubmit={handleSubmit}>
        <div className="composer-toolbar">
          <label className="field field-grow">
            <span>Title</span>
            <input
              type="text"
              placeholder="Untitled Snippet"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </label>

          <label className="field">
            <span>Language</span>
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Expires</span>
            <select value={expiresIn} onChange={(e) => setExpiresIn(e.target.value)}>
              {EXPIRY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <fieldset className="visibility-group">
          <legend>Visibility</legend>
          <label className={`choice ${visibility === "public" ? "selected" : ""}`}>
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
            />
            <span>
              <strong>Public</strong>
              <small>Shown on the Posts page</small>
            </span>
          </label>
          <label className={`choice ${visibility === "private" ? "selected" : ""}`}>
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={visibility === "private"}
              onChange={() => setVisibility("private")}
            />
            <span>
              <strong>Private</strong>
              <small>You when logged in, or anyone with the shareable link</small>
            </span>
          </label>
        </fieldset>

        <label className="field code-field">
          <span>Code</span>
          <textarea
            required
            spellCheck={false}
            placeholder="// Paste your code here..."
            value={code}
            onChange={(e) => setCode(e.target.value)}
            rows={16}
          />
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <div className="composer-footer">
          <p className="hint">Unique short URL · MongoDB TTL auto-delete</p>
          <button className="btn btn-primary" type="submit" disabled={loading || !code.trim()}>
            {loading ? "Creating..." : "Create snippet"}
          </button>
        </div>
      </form>
    </Layout>
  );
}
