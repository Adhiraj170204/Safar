import "./index.css";
import { useEffect } from "react";
import { ThemeProvider } from "./components/ThemeProvider";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Index from "./pages/Index";
import IndexMap from "./pages/IndexMap";
import NewUser from "./pages/NewUser";
import LoginUser from "./pages/LogUser";
import NewCamp from "./pages/NewCamp";
import EditCamp from "./pages/EditCamp";
import ShowCamp from "./pages/ShowCamp";
import Profile from "./pages/Profile";
import ChangePass from "./pages/ChangePass";
import MyCamps from "./pages/MyCamps";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import Favorites from "./pages/Favorites";
import PublicProfile from "./pages/PublicProfile";
import { Toaster } from "./components/ui/sonner";

function App() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="flex flex-col min-h-screen bg-background">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/index" element={<Index />} />
              <Route path="/indexMap" element={<IndexMap />} />
              <Route path="/newUser" element={<NewUser />} />
              <Route path="/logUser" element={<LoginUser />} />
              <Route path="/showCamp/:id" element={<ShowCamp />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/user/:username" element={<PublicProfile />} />

              {/* Protected Routes */}
              <Route
                path="/favorites"
                element={
                  <ProtectedRoute>
                    <Favorites />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/newCamp"
                element={
                  <ProtectedRoute>
                    <NewCamp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/editCamp/:id"
                element={
                  <ProtectedRoute>
                    <EditCamp />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute>
                    <ChangePass />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-camps"
                element={
                  <ProtectedRoute>
                    <MyCamps />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </main>
          <Footer />
          <Toaster />
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
