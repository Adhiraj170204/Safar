import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Tent, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { UserAvatarMenu } from "@/components/ui/UserAvatarMenu";
import { MobileMenu } from "@/components/layout/MobileMenu";
import { useAuthStore } from "@/store/authStore";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const { user, isAuthenticated } = useAuthStore();

  // Sticky navbar with hide-on-scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
          isVisible ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <div
          className={`bg-white/80 dark:bg-neutral-950/70 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 transition-all duration-300 ${
            isScrolled ? "shadow-lg" : ""
          }`}
        >
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between py-3">
              {/* LEFT SECTION - Logo */}
              <div className="flex items-center gap-3">
                <Link to="/" className="flex items-center gap-2 group">
                  <Tent className="h-8 w-8 text-neutral-900 dark:text-white transition-transform group-hover:scale-110" />
                  <span className="hidden sm:block text-xl font-semibold text-neutral-900 dark:text-white">
                    Safar
                  </span>
                </Link>
              </div>

              {/* CENTER SECTION - Navigation Links */}
              <div className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
                <Link
                  to="/index"
                  className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  All Camps
                </Link>
                <Link
                  to="/indexMap"
                  className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  World Map
                </Link>
                <Link
                  to="/newCamp"
                  className="text-sm text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors"
                >
                  Create Camp
                </Link>
              </div>

              {/* RIGHT SECTION - Icons & User Menu */}
              <div className="flex items-center gap-2">
                {isAuthenticated && user ? (
                  <>
                    {/* Logged In - Desktop */}
                    <div className="hidden md:flex items-center gap-4">
                      <ModeToggle />
                      <UserAvatarMenu user={user} />
                    </div>

                    {/* Mobile - Theme Toggle & Hamburger - Logged In */}
                    <div className="md:hidden flex items-center gap-2">
                      <ModeToggle />
                      <button
                        className="p-2 rounded-full text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      >
                        {isMobileMenuOpen ? (
                          <X className="h-6 w-6" />
                        ) : (
                          <Menu className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Logged Out - Desktop */}
                    <div className="hidden md:flex items-center gap-4">
                      <ModeToggle />
                      <Link to="/logUser">
                        <Button
                          variant="ghost"
                          className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800"
                        >
                          Login
                        </Button>
                      </Link>
                      <Link to="/newUser">
                        <Button className="bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200">
                          Sign Up
                        </Button>
                      </Link>
                    </div>

                    {/* Mobile - Theme Toggle & Hamburger - Logged Out */}
                    <div className="md:hidden flex items-center gap-2">
                      <ModeToggle />
                      <button
                        className="p-2 rounded-full text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                      >
                        {isMobileMenuOpen ? (
                          <X className="h-6 w-6" />
                        ) : (
                          <Menu className="h-6 w-6" />
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        user={user}
      />

      {/* Spacer to prevent content from going under fixed navbar */}
      <div className="h-16" />
    </>
  );
}
