import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ViewData from './pages/ViewData';
import UpdateData from './pages/UpdateData';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ViewData />} />
        <Route path="/update" element={<UpdateData />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
