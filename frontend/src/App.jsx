import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./conponents/login";          // フォルダ名を実際に合わせる
import ProtectedRoute from "./conponents/protectroute";
import LoginPage from "./conponents/loginpege";
import ObjectMenuWithCanvas from "./conponents/ObjectMenuWithCanvas";
import CanvasPage from "./conponents/object";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <ObjectMenuWithCanvas />
                <CanvasPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}