import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Archivos protegidos (`.devsquad/perfil.md`): referencia visual del
    // demo, no forman parte del código de la aplicación y no se tocan.
    "support.js",
    "index.html",
    "uploads/**",
  ]),
  {
    // Candado 3 de arquitectura.md §6.2: `src/app/**` y `src/components/**`
    // nunca pueden importar el cliente Supabase con privilegios ni las
    // mutaciones directas de base de datos. Toda escritura pasa por
    // `src/server/actions/`, que llama a `src/server/domain/`.
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/server/supabase/admin", "**/server/supabase/admin.ts"],
              message:
                "El cliente service_role (admin.ts) salta RLS y solo puede usarse dentro de src/server/. Usa una Server Action en su lugar.",
            },
            {
              group: ["**/server/db/mutations/**"],
              message:
                "Las mutaciones de base de datos no se llaman directo desde app/ ni components/. Pasa por src/server/actions/.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
