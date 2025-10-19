"use client";

import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-purple-900 text-white pt-16 pb-6 relative overflow-hidden">
      {/* Top Gradient Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500"></div>

      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 border-b border-purple-700 pb-12">
          {/* Brand & Mission */}
          <div className="col-span-2 lg:col-span-2">
            <h3 className="text-3xl font-extrabold text-pink-500 mb-4">
              RentHub
            </h3>
            <p className="text-purple-300 text-sm max-w-xs">
              Secure your perfect Ugandan stay effortlessly. Connecting guests
              with quality homes using Mobile Money and AI.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 uppercase text-sm tracking-widest">
              Discover
            </h4>
            <ul className="space-y-3 text-purple-300">
              <li>
                <Link
                  href="/"
                  className="hover:text-pink-500 transition-colors"
                >
                  Featured
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="hover:text-pink-500 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="hover:text-pink-500 transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-pink-500 transition-colors"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Hosting */}
          <div>
            <h4 className="font-semibold text-white mb-4 uppercase text-sm tracking-widest">
              Host
            </h4>
            <ul className="space-y-3 text-purple-300">
              <li>
                <Link
                  href="/listing/create"
                  className="hover:text-pink-500 transition-colors"
                >
                  List Your Property
                </Link>
              </li>
              <li>
                <Link
                  href="/owner-guide"
                  className="hover:text-pink-500 transition-colors"
                >
                  Hosting Guide
                </Link>
              </li>
              <li>
                <Link
                  href="/faq-host"
                  className="hover:text-pink-500 transition-colors"
                >
                  Host FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-semibold text-white mb-4 uppercase text-sm tracking-widest">
              Legal
            </h4>
            <ul className="space-y-3 text-purple-300">
              <li>
                <Link
                  href="/terms"
                  className="hover:text-pink-500 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-pink-500 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/sitemap"
                  className="hover:text-pink-500 transition-colors"
                >
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 flex flex-col md:flex-row justify-between items-center text-sm text-purple-400">
          <p className="order-2 md:order-1 mt-4 md:mt-0">
            &copy; {currentYear} RentHub. All rights reserved. Made with ❤️ in
            Uganda.
          </p>
          <div className="order-1 md:order-2 flex space-x-6">
            <a
              href="https://github.com/vanheaven-ui"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-500 transition-colors flex items-center gap-2"
            >
              {/* GitHub Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 16 16"
              >
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.51.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.23 0 .21.15.46.55.38C13.71 14.53 16 11.54 16 8c0-4.42-3.58-8-8-8z" />
              </svg>
              My GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
