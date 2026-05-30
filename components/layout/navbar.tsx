"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type Variants, motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { UserMenu } from "@/components/ui/user-menu";

const BASE_NAV_LINKS = [
  { label: "Ali Zaenal Abidin", href: "https://alizaenalabidin.com/", external: true },
  { label: "Upgrade", href: "/upgrade", external: false },
];

const easeOutExpo = (t: number) => 1 - Math.pow(2, -10 * t);

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { ease: easeOutExpo, duration: 0.5 } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const loadUser = async (uid: string, email: string) => {
      const { data: profile } = await supabase.from("profiles").select("role, name").eq("id", uid).single();
      setUser({ email, name: profile?.name || email.split("@")[0] });
      setIsAdmin(profile?.role === "admin");
    };

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) loadUser(data.user.id, data.user.email ?? "");
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) loadUser(session.user.id, session.user.email ?? "");
      else { setUser(null); setIsAdmin(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const NAV_LINKS = [
    ...(isAdmin ? [] : BASE_NAV_LINKS),
    ...(user ? [] : [{ label: "Masuk", href: "/login", external: false }]),
  ];

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const prevPath = useRef(pathname);
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      setMobileOpen(false);
    }
  }, [pathname]);

  return (
    <>
      {/* Floating pill navbar */}
      <header className="fixed top-4 sm:top-[30px] left-4 right-4 sm:left-0 sm:right-0 z-50 flex justify-center sm:px-6">
        <nav className="flex items-center bg-black/80 backdrop-blur-md w-full sm:w-auto rounded-full px-4 sm:pl-3 sm:pr-[18px] py-3 sm:py-2 shadow-xl shadow-black/20">
          {/* Logo */}
          <Link
            href="/"
            className="text-base sm:text-[1.35rem] text-white px-2 sm:px-3 py-1 transition-transform duration-150 hover:scale-105 inline-block mr-1"
            style={{ fontFamily: "var(--font-malvian), Malvian, sans-serif" }}
          >
            Tanya AZA
          </Link>

          {/* Spacer — pushes items to the right on mobile */}
          <div className="flex-1 lg:hidden" />

          {/* Desktop links */}
          <ul className="hidden lg:flex items-center ml-1">
            {NAV_LINKS.map(({ label, href, external }, i) => (
              <motion.li
                key={href}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, ease: easeOutExpo, delay: 0.05 + i * 0.06 }}
              >
                {external ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 xl:px-3 py-1.5 whitespace-nowrap font-medium text-white transition-transform duration-150 hover:scale-105 inline-block"
                    style={{ fontSize: "clamp(14px, 1.5vw, 21px)", lineHeight: "29px", fontFamily: "var(--font-body)" }}
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    href={href}
                    className="px-2.5 xl:px-3 py-1.5 whitespace-nowrap font-medium text-white transition-transform duration-150 hover:scale-105 inline-block"
                    style={{ fontSize: "clamp(14px, 1.5vw, 21px)", lineHeight: "29px", fontFamily: "var(--font-body)" }}
                  >
                    {label}
                  </Link>
                )}
              </motion.li>
            ))}
          </ul>

          {/* Logged in actions */}
          {user && (
            <div className="hidden lg:flex items-center gap-2 ml-1">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="px-2.5 xl:px-3 py-1.5 whitespace-nowrap font-medium text-white inline-block"
                  style={{ fontSize: "clamp(14px, 1.5vw, 21px)", lineHeight: "29px", fontFamily: "var(--font-body)" }}
                >
                  Admin Panel
                </Link>
              )}
              <Link
                href="/chat"
                className="px-2.5 xl:px-3 py-1.5 whitespace-nowrap font-medium text-white transition-transform duration-150 hover:scale-105 inline-block"
                style={{ fontSize: "clamp(14px, 1.5vw, 21px)", lineHeight: "29px", fontFamily: "var(--font-body)" }}
              >
                Chat
              </Link>
              <div className="px-2.5 xl:px-3 py-1.5">
                <UserMenu name={user?.name || ""} onLogout={handleLogout} fontSize="clamp(14px, 1.5vw, 21px)" textColor="white" />
              </div>
            </div>
          )}

          {/* Hamburger */}
          <button
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
            className="lg:hidden flex items-center justify-center w-9 h-9 text-white/70 hover:text-white ml-1"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </nav>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            className="fixed inset-0 z-40 bg-[#1A1A1A] flex flex-col justify-center px-8"
            initial={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            animate={{ opacity: 1, clipPath: "inset(0 0 0% 0)" }}
            exit={{ opacity: 0, clipPath: "inset(0 0 100% 0)" }}
            transition={{ ease: easeOutExpo, duration: 0.5 }}
          >
            <motion.ul
              className="flex flex-col gap-5"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="hidden"
            >
              {NAV_LINKS.map(({ label, href, external }) => (
                <motion.li key={href} variants={itemVariants}>
                  {external ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-4xl sm:text-5xl leading-none text-white hover:text-[#C8A96E] transition-colors"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      href={href}
                      className={cn(
                        "text-4xl sm:text-5xl leading-none transition-colors hover:text-[#C8A96E]",
                        pathname === href ? "text-[#C8A96E]" : "text-white"
                      )}
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {label}
                    </Link>
                  )}
                </motion.li>
              ))}
            </motion.ul>

            {user && (
              <motion.div className="flex flex-col gap-4 mt-6" variants={containerVariants}>
                {isAdmin && (
                  <motion.div variants={itemVariants}>
                    <Link
                      href="/admin"
                      className="text-4xl sm:text-5xl leading-none text-white"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      ADMIN PANEL
                    </Link>
                  </motion.div>
                )}
                <motion.div variants={itemVariants}>
                  <Link
                    href="/chat"
                    className="text-5xl leading-none text-white hover:text-[#C8A96E] transition-colors"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    CHAT
                  </Link>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <button
                    onClick={handleLogout}
                    className="text-3xl leading-none text-white/50 hover:text-white transition-colors"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    KELUAR
                  </button>
                </motion.div>
              </motion.div>
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
