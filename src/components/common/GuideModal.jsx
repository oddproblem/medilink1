import React, { useContext, useEffect, useState } from "react";
import { GuideContext } from "../../context/GuideContext.jsx";
import { useLang } from '../../context/LangContext';

const GuideModal = () => {
  const { showGuide, currentGuide, stepIndex, nextStep, skipGuide } = useContext(GuideContext);
  const [style, setStyle] = useState({});
  const [position, setPosition] = useState("right"); // 'right', 'below', 'above'
  const { t } = useLang();
  const step = currentGuide[stepIndex]; // safe even if empty

  useEffect(() => {
    // Clear highlights
    document.querySelectorAll(".guide-highlight").forEach((el) => {
      el.classList.remove("guide-highlight");
    });

    if (!showGuide || !step) return;

    const el = document.querySelector(step.target);
    if (el) {
      el.classList.add("guide-highlight");

      const rect = el.getBoundingClientRect();
      const cardWidth = 300;
      const cardHeight = 120; // approx guide card height
      const margin = 10;
      const spaceFromEdge = 20;

      let topPos, leftPos;

      // --- Positioning checks ---
      const canFitRight = rect.right + margin + cardWidth <= window.innerWidth - spaceFromEdge;
      const canFitBelow = rect.bottom + margin + cardHeight <= window.innerHeight - spaceFromEdge;
      const canFitAbove = rect.top - margin - cardHeight >= spaceFromEdge;

      if (canFitRight) {
        setPosition("right");
        topPos = rect.top + window.scrollY;
        leftPos = rect.right + margin + window.scrollX;
      } else if (canFitBelow) {
        setPosition("below");
        topPos = rect.bottom + margin + window.scrollY;
        leftPos = rect.left + window.scrollX;
      } else if (canFitAbove) {
        setPosition("above");
        topPos = rect.top - cardHeight - margin + window.scrollY;
        leftPos = rect.left + window.scrollX;
      } else {
        setPosition("right");
        topPos = Math.min(rect.top + window.scrollY, window.innerHeight - cardHeight - spaceFromEdge);
        leftPos = Math.min(rect.right + margin + window.scrollX, window.innerWidth - cardWidth - spaceFromEdge);
      }

      setStyle({
        position: "absolute",
        top: topPos,
        left: leftPos,
        zIndex: 10001,
        transition: "all 0.3s ease-in-out", // smooth animation
      });
    }

    return () => {
      document.querySelectorAll(".guide-highlight").forEach((el) => {
        el.classList.remove("guide-highlight");
      });
    };
  }, [step, showGuide]);

  if (!showGuide || !step) return null;

  // --- Emoji positioning based on card position ---
  let emojiStyle = {};
  if (position === "right") {
    emojiStyle = {
      top: (style.top || 0) + 10,
      left: (style.left || 0) - 35,
      transform: "scaleX(1)",
    };
  } else if (position === "below") {
    emojiStyle = {
      top: (style.top || 0) - 25,
      left: (style.left || 0) + 10,
      transform: "rotate(-90deg) scaleX(-1)",
    };
  } else if (position === "above") {
    emojiStyle = {
      top: (style.top || 0) + (120 + 5),
      left: (style.left || 0) + 10,
      transform: "rotate(90deg)",
    };
  }

  return (
    <>
      {/* Overlay (non-blocking) */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-[9999]"
        style={{ pointerEvents: "none" }} // overlay won't block clicks
      />

      {/* Arrow emoji */}
      <div
        style={{
          position: "absolute",
          zIndex: 10002,
          fontSize: "2rem",
          color: "#fff",
          transition: "all 0.3s ease-in-out",
          ...emojiStyle,
        }}
      >
        👉
      </div>

      {/* Guide Card */}
      <div
        style={style}
        className="bg-white dark:bg-gray-900 p-4 rounded shadow-lg max-w-xs z-[10001] opacity-0 animate-fade-in"
      >
        <p style={{ whiteSpace: "pre-line" }}>{t(step.content)}</p>
        <div className="flex justify-end mt-2 space-x-2">
          <button
            onClick={skipGuide}
            className="px-3 py-1 rounded bg-gray-300 dark:bg-gray-700"
          >
            {t("skip")}
          </button>
          <button
            onClick={nextStep}
            className="px-3 py-1 rounded bg-blue-600 text-white"
          >
            {t("next")}
          </button>
        </div>
      </div>

      {/* Tailwind animation class */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            opacity: 1 !important;
            animation: fadeIn 0.3s ease-in-out;
          }
        `}
      </style>
    </>
  );
};

export default GuideModal;
