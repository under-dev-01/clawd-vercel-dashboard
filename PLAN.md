# Clawd Dashboard — Project Plan

## Le problème actuel

J'ai codé vite fait des features sans réfléchir à :
- Qui utilise vraiment ce dashboard et pourquoi
- Quelle est la hiérarchie d'importance des fonctionnalités
- Comment structurer le code pour qu'il soit maintenable
- L'UX réelle (pas juste "ça marche")

## L'utilisateur (Rob)

D'après ce que je sais :
- Veut voir la conso des IA (Claude/Kimi) → **priorité haute**
- Veut accéder aux fichiers du VPS sans terminal Hostinger → **priorité haute**
- Préfère le light mode
- Veut quelque chose de visuel, pas générique "AI slop"
- Veut pouvoir faire des actions, pas juste consulter

## Ce que le dashboard DOIT faire (MVP)

### 1. Vue d'ensemble rapide (Homepage)
- État du VPS en un coup d'œil (CPU, RAM, Disk)
- Conso API des dernières 24h (tokens, coût estimé si possible)
- Dernières activités (fichiers modifiés, sessions)
- Pas de clutter — informations essentielles seulement

### 2. File Manager
- Navigation fluide
- Preview inline (texte, images, code avec syntax highlighting)
- Actions : download, edit, create, delete, rename
- Search qui marche bien
- Upload drag & drop

### 3. AI Stats
- Tokens utilisés (Claude vs Kimi)
- Historique de consommation (graphique simple)
- Sessions actives
- Coûts si disponible

### 4. Terminal léger
- Commandes de base pour dépanner
- Pas un vrai terminal, juste des utilitaires

## Architecture technique

### Frontend (Next.js sur Vercel)
```
src/
├── app/
│   ├── page.tsx          # Homepage avec overview
│   ├── files/
│   │   └── page.tsx      # File manager
│   ├── stats/
│   │   └── page.tsx      # AI stats
│   └── layout.tsx        # Nav commune
├── components/
│   ├── ui/               # Composants de base (Button, Card, Input...)
│   ├── FileList.tsx
│   ├── FilePreview.tsx
│   ├── SystemStats.tsx
│   ├── AIUsageChart.tsx
│   └── SearchDialog.tsx
├── lib/
│   ├── api.ts            # Client API
│   └── utils.ts          # Helpers
└── hooks/
    ├── useFiles.ts
    └── useStats.ts
```

### Backend (Node.js sur VPS)
```
/root/clawd-dashboard/
├── server.js             # Express server
├── routes/
│   ├── files.js          # CRUD fichiers
│   ├── system.js         # Stats système
│   └── ai.js             # Stats IA (parse logs clawdbot)
├── middleware/
│   └── auth.js
└── utils/
    └── logParser.js      # Parse les logs pour extraire stats IA
```

### Stats IA — Comment les récupérer ?

Options :
1. Parser les logs journalctl de clawdbot
2. Demander à clawdbot d'écrire ses stats dans un fichier JSON
3. Créer un endpoint dans clawdbot qui expose les stats

Pour le MVP : parser les logs (option 1)

## Design

### Principes
- Clean, pas chargé
- Light mode par défaut
- Typographie claire (Inter ou system fonts)
- Couleurs neutres avec accents subtils
- Pas de gradients flashy, pas d'emojis partout
- Inspirations : Linear, Vercel dashboard, Raycast

### Palette
- Background: #FAFAFA
- Cards: #FFFFFF
- Borders: #E5E5E5
- Text primary: #171717
- Text secondary: #737373
- Accent: #2563EB (blue-600)
- Success: #16A34A
- Warning: #CA8A04
- Error: #DC2626

## Plan d'exécution

### Phase 1 : Backend solide ✅
- [x] Restructurer le serveur Express
- [x] Endpoint /api/ai/stats qui parse les JSONL sessions
- [x] Parsing streaming des fichiers (performance)
- [x] Cache 1 minute pour les stats agrégées

### Phase 2 : Frontend structure ✅
- [x] Single-page app avec 3 vues (overview, ai, files)
- [x] Navigation header
- [x] API client avec auth

### Phase 3 : Homepage / Overview ✅
- [x] Cards stats système (disk, memory)
- [x] Cards conso IA (tokens, cost)
- [x] Breakdown par provider avec barres visuelles
- [x] Uptime info

### Phase 4 : File Manager ✅
- [x] Liste des fichiers
- [x] Breadcrumb navigation
- [x] Preview modal (text + images)
- [x] Download
- [x] Search (avec raccourci /)

### Phase 5 : AI Stats page ✅
- [x] Summary cards (input/output tokens, cost, sessions)
- [x] Breakdown par model
- [x] Timeline graphique (barres horaires)

### Phase 6 : Polish (TODO)
- [ ] Responsive mobile (basique fait)
- [ ] Loading states (basique fait)
- [ ] Error handling plus robuste
- [ ] Dark mode toggle

## Découvertes clés (investigation faite)

### Source de données IA trouvée !
Les sessions clawdbot sont stockées dans `/root/.clawdbot/agents/main/sessions/*.jsonl`

Chaque fichier JSONL contient :
```json
{
  "type": "message",
  "message": {
    "role": "assistant",
    "content": [...],
    "provider": "kimi-coding",
    "model": "kimi-for-coding",
    "usage": {
      "input": 9688,
      "output": 259,
      "totalTokens": 9947,
      "cost": { "input": 0, "output": 0, "total": 0 }
    },
    "timestamp": 1769856603216
  }
}
```

**Données disponibles :**
- ✅ Tokens input/output par message
- ✅ Provider et model utilisé
- ✅ Timestamps précis
- ✅ Type de contenu (text, thinking, toolCall, toolResult)
- ⚠️ Costs à 0 pour Kimi (normal, pas de billing)

### Architecture finale

**Backend** parse les fichiers JSONL et expose :
- `/api/ai/summary` — tokens totaux par provider/model sur période
- `/api/ai/history` — timeline d'utilisation
- `/api/ai/sessions` — liste des sessions avec stats

**Frontend** affiche :
- Graphique de conso tokens (par jour/heure)
- Breakdown Claude vs Kimi
- Top sessions par utilisation
- Coût estimé (si dispo)

## Questions ouvertes

1. **Tunnel stable** : Le Cloudflare quick tunnel change à chaque restart
   - Solution immédiate : script qui update l'env var Vercel après restart
   - Solution long terme : tunnel nommé Cloudflare (gratuit avec compte)

2. **Performance** : Les fichiers JSONL peuvent être gros
   - Parser de façon streaming, pas tout charger en mémoire
   - Cacher les résultats agrégés

---

Phase 1 : Backend avec vrai parsing des sessions JSONL
