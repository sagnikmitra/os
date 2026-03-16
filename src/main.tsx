import { createRoot } from "react-dom/client";
// Import lovable auth early so it processes OAuth callbacks before app renders
import "@/integrations/lovable/index";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
