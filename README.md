# back_office_simandou_trading

**Backoffice web** de la plateforme Simandou Trading.

## Stack
- **React + Vite + TypeScript**
- `react-router` (routing), `axios` (client API)

## Rôle
Interface interne : validation KYC, gestion des offres & taux, suivi des transactions, gestion des comptes internes, module Settings (plafonds, règles BCRG).

## Démarrage (dev)

```bash
cp .env.example .env   # VITE_API_URL = URL de l'API
npm install
npm run dev            # http://localhost:5173
```

### Scripts
| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de dev Vite |
| `npm run build` | Typecheck + build de prod |
| `npm run lint` | ESLint (0 warning toléré) |

### Structure
```
src/
  lib/api.ts      # client axios (baseURL = VITE_API_URL)
  pages/          # LoginPage, DashboardPage (stubs)
  App.tsx         # routing (react-router)
  main.tsx        # entrée React
```

## Specs
Cahier des charges : [Simandou-Trading/docs_simandou_trading](https://github.com/Simandou-Trading/docs_simandou_trading)

> ⚠️ **Workflow Git** : tout changement passe par une **Pull Request** validée par le co-développeur (pas de push direct sur `main`).
