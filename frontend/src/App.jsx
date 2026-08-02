import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import Home from "./pages/Home.jsx";
import ViewSnippet from "./pages/ViewSnippet.jsx";
import Login from "./pages/Login.jsx";
import Posts from "./pages/Posts.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/posts" element={<Posts />} />
        <Route path="/login" element={<Login />} />
        <Route path="/s/:shortId" element={<ViewSnippet />} />
      </Routes>
    </AuthProvider>
  );
}
