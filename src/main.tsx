import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "./estilos/tokens.css";
import "./estilos/base.css";
import "./estilos/componentes.css";
import "./estilos/pantallas.css";

import { MotionConfig } from "motion/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { ProveedorApp } from "./ContextoApp.tsx";
import { Inicio, Marco } from "./Marco.tsx";
import { Bienvenida } from "./pantallas/Bienvenida.tsx";
import { CrearTarea } from "./pantallas/CrearTarea.tsx";
import { DetalleTarea } from "./pantallas/DetalleTarea.tsx";
import { ListaTareas } from "./pantallas/ListaTareas.tsx";
import { ModelosIA } from "./pantallas/ModelosIA.tsx";

// Hash router: el backend sirve el build como archivos estáticos; con #/ruta recargar nunca da 404.
const router = createHashRouter([
  {
    element: <Marco />,
    children: [
      { index: true, element: <Inicio /> },
      { path: "bienvenida", element: <Bienvenida /> },
      { path: "tareas/nueva", element: <CrearTarea /> },
      { path: "tareas/en-ejecucion", element: <ListaTareas tipo="en_ejecucion" /> },
      { path: "tareas/pendientes", element: <ListaTareas tipo="pendientes" /> },
      { path: "tareas/:tareaId", element: <DetalleTarea /> },
      { path: "modelos", element: <ModelosIA /> },
      { path: "*", element: <Inicio /> },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <ProveedorApp>
        <RouterProvider router={router} />
        <Toaster
          position="bottom-right"
          toastOptions={{ className: "aviso-flotante" }}
          offset={24}
          gap={10}
        />
      </ProveedorApp>
    </MotionConfig>
  </StrictMode>,
);
