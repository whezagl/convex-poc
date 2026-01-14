import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import ViewData from "./pages/ViewData";

// Placeholder for Update page (will be implemented in subtask 7-1)

function UpdateData() {
  return (
    <div>
      <h2>Update Data</h2>
      <p>Update data page - Form for editing mock data (to be implemented)</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <nav className="navbar">
          <h1>Convex POC</h1>
          <ul className="nav-links">
            <li>
              <NavLink
                to="/view"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                View Data
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/update"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Update Data
              </NavLink>
            </li>
          </ul>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<ViewData />} />
            <Route path="/view" element={<ViewData />} />
            <Route path="/update" element={<UpdateData />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
