import React from "react";
import { IonButton, IonIcon } from "@ionic/react";
import { sunnyOutline, moonOutline, desktopOutline } from "ionicons/icons";
import { useTheme, ThemeMode } from "../lib/ThemeContext";
import "./ThemeToggle.css";

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const next: Record<ThemeMode, ThemeMode> = {
      system: "light",
      light: "dark",
      dark: "system",
    };
    setTheme(next[theme]);
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return sunnyOutline;
      case "dark":
        return moonOutline;
      case "system":
      default:
        return desktopOutline;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
      default:
        return "Auto";
    }
  };

  return (
    <IonButton
      fill="clear"
      className="themeToggleBtn"
      onClick={cycleTheme}
      title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
    >
      <IonIcon slot="start" icon={getIcon()} />
      <span className="themeToggleText">{getLabel()}</span>
    </IonButton>
  );
};

