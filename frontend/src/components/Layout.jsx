import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout({ children, compact = false }) {
  const { user, logout, isAuthenticated, loading } = useAuth();

  return (
    <div className={`shell ${compact ? "shell--compact" : ""}`}>
      <div className="atmosphere" aria-hidden="true" />
      <header className="topbar">
        <Link to="/" className="brand">
          SnippetVault
        </Link>
        <nav className="nav">
          <NavLink to="/posts" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Posts
          </NavLink>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            New
          </NavLink>
          {!loading && isAuthenticated ? (
            <>
              <span className="nav-user">{user.name || user.email}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={logout}>
                Log out
              </button>
            </>
          ) : !loading ? (
            <NavLink to="/login" className="btn btn-secondary btn-sm">
              Log in
            </NavLink>
          ) : null}
        </nav>
      </header>
      <main className="main">{children}</main>
    </div>
  );
}
