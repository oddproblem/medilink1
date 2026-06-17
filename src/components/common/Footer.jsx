// client/src/components/Footer.jsx
import React from "react";
import { useLang } from "../../context/LangContext";

const Footer = () => {
  const { translations } = useLang();

  return (
    <footer className="py-12 bg-gray-900 dark:bg-gray-950 text-gray-300 dark:text-gray-400">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-4 items-center">
          {/* Left Side */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <i className="bi bi-heart-pulse-fill text-red-500 text-2xl" />
              <strong className="text-xl">
                {translations?.footerTitle || "Migrant Health"}
              </strong>
            </div>
            <p className="text-sm mb-1">
              © {new Date().getFullYear()}{" "}
              {translations?.footerTitle || "Migrant Health"}.{" "}
              {translations?.allRights || "All rights reserved."}
            </p>
            <p className="text-sm mb-2">
              {translations?.footerBuiltWith ||
                "Built with React, Tailwind CSS, Chart.js & Three.js."}
            </p>
            {/* ✅ Contact Info */}
            <p className="text-sm">
              <span className="font-semibold">{translations?.contactUs || "Contact Us:"}</span>{" "}
              <a
                href="mailto:vrishank.23bce8373@vitapstudent.ac.in"
                className="text-blue-400 hover:underline"
              >
                vrishank.23bce8373@vitapstudent.ac.in
              </a>
            </p>
          </div>

          {/* Right Side */}
          <div className="col-span-1 text-left md:text-right">
            <a
              href="/#features"
              className="mr-4 hover:text-white transition-colors"
            >
              {translations?.features || "Features"}
            </a>
            <a
              href="/#stats"
              className="mr-4 hover:text-white transition-colors"
            >
              {translations?.stats || "Stats"}
            </a>
            <a href="/auth" className="hover:text-white transition-colors">
              {translations?.signIn || "Sign in"}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
