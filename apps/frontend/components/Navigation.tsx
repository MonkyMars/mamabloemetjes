"use client";

import Link from "next/link";
import { Button } from "./Button";
import {
  FaHome,
  FaRegUser,
  FaMoon,
  FaSun,
  FaSpinner,
  FaUser,
} from "react-icons/fa";
import { FaCartShopping, FaShop } from "react-icons/fa6";
import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";

const Navigation: React.FC = () => {
  const { isDark, toggleTheme, mounted: themeMounted } = useTheme();
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<string>("");
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    // Handle scroll effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigation = async (href: string) => {
    setLoading(href);
    if (mounted) {
      const currentPath = window.location.pathname;
      if (currentPath === href) {
        setLoading("");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }

    // Clear loading state after a short delay
    setTimeout(() => setLoading(""), 100);
  };

  if (!mounted || !themeMounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-sm bg-background/60 border-b border-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-primary/20 rounded-lg animate-pulse"></div>
            </div>
            <div className="hidden md:flex space-x-4">
              <div className="w-16 h-8 bg-primary/10 rounded animate-pulse"></div>
              <div className="w-16 h-8 bg-primary/10 rounded animate-pulse"></div>
            </div>
            <div className="flex space-x-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full animate-pulse"></div>
              <div className="w-20 h-10 bg-primary/20 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav
      className={`
      fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out  border-b-primary/20 border-1 border-transparent
      ${
        isScrolled
          ? "backdrop-blur-md bg-background/80 shadow-lg shadow-primary/10"
          : "backdrop-blur-sm bg-background/60"
      }
    `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex-shrink-0 group">
            <Link
              href="/"
              className="flex items-center space-x-2"
              onClick={() => handleNavigation("/")}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary via-secondary/60 to-secondary rounded-lg flex items-center justify-center transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-secondary/30 group-hover:shadow-primary/40">
                {loading === "/" ? (
                  <FaSpinner className="text-background text-sm animate-spin" />
                ) : (
                  <span className="text-background font-bold text-sm">M</span>
                )}
              </div>
              <h1 className="font-bold text-xl bg-gradient-to-r from-primary via-secondary/80 to-secondary bg-clip-text text-transparent group-hover:from-secondary group-hover:via-primary/80 group-hover:to-primary transition-all duration-500 relative">
                Mama bloemetjes
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-secondary via-primary to-secondary group-hover:w-full transition-all duration-500 rounded-full"></div>
              </h1>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-1">
              <NavLink
                href="/"
                icon={<FaHome />}
                label="Home"
                isLoading={loading === "/"}
                onClick={() => handleNavigation("/")}
              />
              <NavLink
                href="/shop"
                icon={<FaShop />}
                label="Shop"
                isLoading={loading === "/shop"}
                onClick={() => handleNavigation("/shop")}
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="relative overflow-hidden group bg-gradient-to-br from-primary/10 to-secondary/10 hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300"
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                <FaSun
                  className={`absolute inset-0 transform transition-all duration-500 ${
                    isDark
                      ? "rotate-90 scale-0 opacity-0"
                      : "rotate-0 scale-100 opacity-100"
                  } text-secondary group-hover:text-primary group-hover:drop-shadow-lg`}
                />
                <FaMoon
                  className={`absolute inset-0 transform transition-all duration-500 ${
                    isDark
                      ? "rotate-0 scale-100 opacity-100"
                      : "-rotate-90 scale-0 opacity-0"
                  } text-primary group-hover:text-secondary group-hover:drop-shadow-lg`}
                />
              </div>
            </Button>

            {/* User Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative overflow-hidden group bg-gradient-to-br from-primary/10 to-secondary/10 hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300"
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                {loading === "/login" ? (
                  <FaSpinner className="text-primary animate-spin group-hover:text-secondary transition-colors duration-300" />
                ) : (
                  <FaUser className="text-primary group-hover:text-secondary group-hover:drop-shadow-lg transition-all duration-300" />
                )}
              </div>
            </Button>

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative overflow-hidden group bg-gradient-to-br from-primary/10 to-secondary/10 hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300"
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                {loading === "/cart" ? (
                  <FaSpinner className="text-primary animate-spin group-hover:text-secondary transition-colors duration-300" />
                ) : (
                  <FaCartShopping className="text-primary group-hover:text-secondary group-hover:drop-shadow-lg transition-all duration-300" />
                )}
              </div>
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden relative overflow-hidden group bg-gradient-to-br from-primary/10 to-secondary/10 hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300"
            >
              <div className="relative w-4 h-4 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary group-hover:text-secondary group-hover:drop-shadow-lg transition-all duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      isMobileMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <div
        className={`md:hidden border-t border-primary/10 bg-background/95 backdrop-blur-md overflow-hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen ? "max-h-48 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          <MobileNavLink
            href="/"
            icon={<FaHome />}
            label="Home"
            isLoading={loading === "/"}
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleNavigation("/");
            }}
          />
          <MobileNavLink
            href="/shop"
            icon={<FaShop />}
            label="Shop"
            isLoading={loading === "/shop"}
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleNavigation("/shop");
            }}
          />
          <MobileNavLink
            href="/login"
            icon={<FaRegUser />}
            label="Log in"
            isLoading={loading === "/login"}
            onClick={() => {
              setIsMobileMenuOpen(false);
              handleNavigation("/login");
            }}
          />
        </div>
      </div>
    </nav>
  );
};

// Desktop Navigation Link Component
const NavLink: React.FC<{
  href: string;
  icon: React.ReactNode;
  label: string;
  isLoading?: boolean;
  onClick?: () => void;
}> = ({ href, icon, label, isLoading, onClick }) => (
  <Link href={href} className="group relative" onClick={onClick}>
    <div className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground transition-all duration-200 hover:bg-primary/5 group-hover:scale-105 group-hover:-translate-y-0.5 relative overflow-hidden">
      <span className="mr-2 text-primary group-hover:text-secondary transition-colors duration-200 relative z-10">
        {isLoading ? <FaSpinner className="animate-spin" /> : icon}
      </span>
      <span className="relative z-10">{label}</span>
      <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-secondary via-primary to-secondary transform -translate-x-1/2 group-hover:w-full transition-all duration-300 ease-out rounded-full shadow-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 via-primary/5 to-secondary/5 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left rounded-lg"></div>
    </div>
  </Link>
);

// Mobile Navigation Link Component
const MobileNavLink: React.FC<{
  href: string;
  icon: React.ReactNode;
  label: string;
  isLoading?: boolean;
  onClick?: () => void;
}> = ({ href, icon, label, isLoading, onClick }) => (
  <Link href={href} className="group" onClick={onClick}>
    <div className="flex items-center px-3 py-2 rounded-lg text-base font-medium text-foreground/80 hover:text-foreground hover:bg-primary/5 transition-all duration-200 transform hover:translate-x-1 hover:shadow-sm relative overflow-hidden">
      <span className="mr-3 text-primary group-hover:text-secondary transition-colors duration-200 relative z-10">
        {isLoading ? <FaSpinner className="animate-spin" /> : icon}
      </span>
      <span className="relative z-10">{label}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-secondary/8 via-primary/5 to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left"></div>
    </div>
  </Link>
);

export default Navigation;
