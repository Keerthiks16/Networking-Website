import { useState, useEffect } from "react";

const themes = {
  dark: {
    name: "Modern & Chat-Focused (Dark Mode)",
    primary: "bg-green-600 text-white", // WhatsApp Green
    secondary: "bg-gray-800 text-white", // Dark Mode Chat Background
    accent: "bg-blue-500 text-white", // Highlight Color for Buttons
    background: "bg-gray-900 text-gray-200", // Dark UI for better focus
  },
  light: {
    name: "Elegant & Corporate (Light Mode)",
    primary: "bg-gray-900 text-white", // Dark Charcoal for a Premium Feel
    secondary: "bg-yellow-400 text-black", // Gold for Highlighting Important Features
    accent: "bg-indigo-500 text-white", // Deep Indigo for Call-to-Action Buttons
    background: "bg-gray-100 text-gray-800", // Soft Background for Readability
  },
};

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div
      className={`h-screen w-screen flex flex-col items-center justify-center transition-all duration-500 ${themes[theme].background}`}
    >
      <h1 className="text-3xl font-bold mb-4">{themes[theme].name}</h1>

      <div className="grid grid-cols-2 gap-4 w-2/3 max-w-lg">
        <div
          className={`h-24 rounded-lg flex items-center justify-center ${themes[theme].primary}`}
        >
          Primary
        </div>
        <div
          className={`h-24 rounded-lg flex items-center justify-center ${themes[theme].secondary}`}
        >
          Secondary
        </div>
        <div
          className={`h-24 rounded-lg flex items-center justify-center ${themes[theme].accent}`}
        >
          Accent
        </div>
        <div
          className={`h-24 rounded-lg flex items-center justify-center ${themes[theme].background}`}
        >
          Background
        </div>
      </div>

      <button
        onClick={toggleTheme}
        className="mt-6 px-4 py-2 rounded-lg bg-gray-800 text-white"
      >
        Toggle Theme 🌗
      </button>
    </div>
  );
}
