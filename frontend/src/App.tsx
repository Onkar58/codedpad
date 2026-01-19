import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FilesPage } from "./pages/files";
import { Home } from "./pages/home";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:code" element={<FilesPage />} />
      </Routes>
    </BrowserRouter>
  );
}
