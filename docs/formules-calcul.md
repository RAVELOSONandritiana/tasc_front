# Documentation des formules de calcul

Ce document recense **toutes les formules de calcul** utilisées dans la plateforme de gestion scolaire, organisées par domaine fonctionnel. Chaque formule renvoie au fichier source qui l'implémente.

Conventions utilisées :

- `Σ` désigne une somme.
- Les notes sont sur **/20** (barème malgache), les évaluations d'enseignants sur **/10**.
- Toutes les données historiques (notes, absences, pointages, évaluations) sont **scopées à l'année scolaire active** (`anneeId`) : à chaque nouvelle année scolaire, les calculs repartent de zéro.
- `round(v)` (arrondi standard à 2 décimales) est appliqué à la plupart des moyennes finales : `round(v) = Math.round(v × 100) / 100`.

---

## 1. Socle des moyennes — `src/lib/utils/analyse.ts`

Ce module développe les moyennes pondérées partagées par les pages **Analyse** et **Analyse de classe**.

### 1.1 Coefficient applicable à une note

```
coef(note) = note.coefficient ≠ 0 ? note.coefficient : coef(cours de la note)
```

Pour un `coursId`, `getCoef` renvoie `coursById[coursId].coefficient` (0 s'il s'agit d'un élément inconnu).

### 1.2 Participation d'un élève à un cours

```
estParticipant(cours, eleveId) :
    participants = cours.participants || []
    vrai si  participants vide  (cours de toute la classe)
                OU  participants contient eleveId
```

### 1.3 Moyenne d'une matière (élève, sur un ensemble d'examens)

```
notes_m = notes de l'élève d'un cours donné, dont l'examen appartient à examenIds
moyenneMatiere(coursId) :
    si notes_m vide                → 0
    Σ(valeur × coef) / Σ(coef)     → arrondi à 2 décimales
```

Un élève sans note dans une période ne dégrade pas sa moyenne : il estsimplement ignoré.

### 1.4 Moyenne générale pondérée d'un élève

```
moyenneGenerale(eleve) :
    pour chaque cours où l'élève est participant :
        m = moyenneMatiere(cours)
        si m > 0 : total += m × coef(cours) ; coefTotal += coef(cours)
    résultat = total / coefTotal              (0 si aucun coefficient)
```

Les matières sans note sont exclues du calcul (ni numérateur, ni dénominateur).

### 1.5 Moyenne de la classe pour une matière

```
moyenneClasseMatiere(coursId) :
    pour chaque élève participant :
        m = moyenneMatiere(élève, coursId)
        si m > 0 : somme += m ; n += 1
    résultat = somme / n        (0 si aucun élève noté)
```

### 1.6 Formatage français

`formatFr(v)` : nombre entier → `v.toString()`, sinon `v.toFixed(2)` ; le point `.` est remplacé par la virgule `,`.

---

## 2. Moyennes des pages Bulletin et Délibération

Ces pages implémentent leur propre variante (côté client) dans
`src/routes/(app)/classe/[id]/bulletin/+page.svelte` et
`src/routes/(app)/classe/[id]/deliberation/+page.svelte`.

### 2.1 Coefficient d'une note

```
coefNote(note) = note.coefficient || coefCours(note.coursId)
```

### 2.2 Moyenne d'une matière (délibération)

```
notes_m = notes de l'élève du cours (tous examens confondus)
calculerMoyenneMatiere(notes_m) = Σ(valeur × coefNote) / Σ(coefNote)
```

aucune note → `0` ; aucun coefficient → `0`.

### 2.3 Moyenne d'une matière par périodes (bulletin cumulatif)

Le bulletin cumule les examens sélectionnés :

```
pour chaque examen e de la sélection (dans l'ordre des examens de la classe) :
    moy_e = Σ(valeur × coefNote) / Σ(coefNote)   sur les notes de CET examen
    (examens sans note ignorés)
moyenneMatierePeriodes = Σ moy_e / nb examens notés       → moyennesimple des périodes
```

Règles de sélection des notes (`getNotesEleveExamens`) :

- la note doit appartenir à un **sous-examen** (`sousExamenId` non nul) ;
- si `examenIds` est fourni, la note doit appartenir à l'un de ces examens ;
- déduplication par identifiant de note.

### 2.4 Moyenne générale du bulletin

```
calculerMoyenneGenerale(eleve, examenIds) :
    Σ coef = Σ coef(c) pour chaque cours c où l'élève est participant (estParticipant)
    Σ points = Σ (moyenneMatierePeriodes(c) × coef(c))
    résultat = Σ points / Σ coef            (0 si Σ coef = 0)
```

⚠️ Particularité du bulletin : `estParticipant(cours, élève)` exige des **participants non vides** —
un cours sans participants n'est jamais compté du bulletin. C'est l'inverse du module
`src/lib/utils/analyse.ts` (§ 1.2) où participants vide = toute la classe.

### 2.5 NDef (Note définitive pesée)

Affichée dans le bulletin et la délibération :

```
NDef(matière) = moyenneMatière × coef(cours)
TOTAL NDef    = Σ NDef(matières du bulletin)
```

### 2.6 Moyenne de la classe (bulletin)

```
moyenneClasse(examenIds) =
    Σ (moyennes générales > 0 des élèves) / nombre de moyennes positives
```

### 2.7 Rang de l'élève

```
tri décroissant des élèves par moyenne générale
rang = 1er élève de la ligne triée ; les ex-æquo partagent le rang,
       le suivant distinct prend la position i + 1 (rang dense)
```

### 2.8 Enseignement des appréciations (barème malgache)

`appreciationScale(m)` :

| Moyenne m   | Appréciation      |
| ----------- | ----------------- |
| m ≥ 18      | Excellent         |
| 16 ≤ m < 18 | Très-Bien         |
| 14 ≤ m < 16 | Bien              |
| 12 ≤ m < 14 | Assez-Bien        |
| 10 ≤ m < 12 | Passable          |
| 6 ≤ m < 10  | Faible            |
| 0 < m < 6   | Blâme             |
| m ≤ 0       | — (non renseigné) |

### 2.9 Situation calculée du conseil de classe

```
m ≥ 10     → ADMIS(E)
0 < m < 10 → AJOURNÉ(E)
m ≤ 0      → —
```

Sur le bulletin, la mention ADMIS(E) est complétée de la série et du niveau suivant :
niveau 0 (2nde) → « PREMIER », niveau 1 (1ère) → « TERMINAL ».

### 2.10 Numéro de classe

```
ordre = position dans le tri alphabétique (A→Z) des élèves de même sexe
suffixe = F (fille) / G (garçon)
numéro = `${ordre}${suffixe}`
```

---

## 3. Analyse d'un élève — `src/lib/server/analyseEleve.ts`

### 3.1 Pente de tendance (régression linéairesimple)

```
linearSlope(values) :
    n = nb de points ; si n < 2 → null (pas de tendance)
    x_i = i (position), y_i = values[i]
    pente = Σ (x_i − moyX)(y_i − moyY) / Σ (x_i − moyX)²      (moindres carrés)
```

La pente est exprimée **en points de note par évaluation** (par point de la série).

### 3.2 Classement de la tendance

```
pente ≤ −0,5        → « regression »
pente ≥ +0,5        → « progression »
sinon (ou null)     → « stagnation »
```

### 3.3 Moyenne annuelle d'un élève (historique par année)

```
notes_annee = notes dont le cours appartient à l'année scolaire de l'inscription
moyenne = Σ (valeur × (coefficient || 1)) / max(1, Σ (coefficient || 1))
```

0 note → `0`. Le dénominateur est borné à 1 pour éviter la division par zéro.

### 3.4 Pente de comparaison de classe (par matière)

```
pour chaque examen de la même matière :
    moyenne_classe(examen) = Σ (valeur × coef) / Σ coef   sur les notes des camarades
classeSlope = linearSlope(séquence des moyennes de classe)
```

### 3.5 Badge de diagnostic (matière en baisse)

Si la pente de l'élève ≤ −0,5 :

```
classeSlope ≤ −0,5  → badge « pedagogique »   (la classe entière baisse)
sinon               → badge « individuelle »  (baisse propre à l'élève)
sinon               → badge « ok »
```

La pente globale (`globalSlope`) est calculée sur toutes les notes brutes de l'élève,
triées par date d'attribution.

---

## 4. Durées horaires — `absenceProf.ts`, `pointage.ts`, pages analyse

### 4.1 Durée d'une séance

```
dureeHeures(heureDebut, heureFin) :
    diff = (fin en minutes) − (début en minutes)
    si diff > 0 → round((diff / 60) × 100) / 100        (heures décimales, 2 décimales)
    sinon       → 0
```

Variantes : `heuresPrevuesCalc` (pointage) renvoie `null` si une des deux heures est
inexploitable ou `H1 ≥ H2` ; la page d'analyse générale (§ 5) renvoie `0`.

### 4.2 Heures prévues d'un pointage (séance EDT)

Si le pointage référence une séance de l'emploi du temps, les heures prévues
enregistreées sont précisément `durée de la séance`. Sinon, on retombe sur le
premier créneau du cours :

```
seanceEDT = séance pointée  ??  premier créneau du cours
heuresPrevues = dureeHeures(seanceEDT)            (null si introuvable)
```

### 4.3 Heures manquées d'un pointage

```
manque = max(0, round((heuresPrevues − heuresEffectuees) × 100) / 100)
```

Un pointage complet (effectué ≥ prévu) ne crée jamais d'heures manquées.
Un pointage avec cours manqué (professeur absent) enregistre systématiquement
`heuresEffectuees = 0`.

---

## 5. Assiduité des enseignants — pages Analyse

`src/routes/(app)/analyse/+page.server.ts` et `classe/[id]/analyse/+page.server.ts`.

### 5.1 Heures manquées d'une absence déclarée

Une absence d'enseignant référence une séance de l'emploi du temps : la date porte
l'**heure de début** de la séance manquée ; on retrouve donc la séance exacte :

```
clé de recherche = `coursId | heureDebut de l'absence`       (+ classeId sur l'analyse générale)
heures = durée de la séance retrouvée
       sinon → durée moyenne du cours :
           duréeMoyenne(cours) = Σ durées des séances du cours / nb de séances
       (0 si le cours est inconnu ou sans emploi du temps)
```

### 5.2 Heures manquées cumulées (pointages)

```
manqueTotal(prof, cours) = Σ manque(§ 4.3) des pointages du cours
```

### 5.3 Motifs de couverture des absences

Une absence d'élève n'est marquée **« justifiée »** que si une ligne de rapport
(`rapportLigne`) pointe dessus (couverture par un rapport) — le champ `justifie`
historique n'est pas consulté. Le dashboard et les pages d'analyse appliquent la
même règle ;

---

## 6. Évaluation des enseignants (/10) — `src/lib/server/evaluationProf.ts`

Note de 0 à 10 recalculée à la demande sur l'année scolaire active
(`evaluerProfesseurs(anneeId)`). Deux composantes 50/50.

### 6.1 Composante Assiduité

```
Si heuresPrévues = 0 → noteAssiduité = null (composante ignorée, pas pénalisante)
noteAssiduité = clamp10( 10 × (1 − min(1, heuresManquées / heuresPrévues)) )
clamp10(v) = max(0, min(10, round(v × 100) / 100))
```

Un taux d'assiduité de 100 % → note 10 ; un quart des heures manquées → 7,5 ;
toutes les heures manquées (ou plus — cf. § 6.3) → 0.

### 6.2 Composante Réussite des élèves

```
Si moyenneÉlèves = 0 → noteRéussite = null (composante ignorée)
noteRéussite = clamp10( (moyenneÉlèves / 20) × 10 )          (barème /20 ramené sur /10)
```

avec `moyenneÉlèves` pondérée par les coefficients de cours :

```
moyenneCours = Σ (valeur × (coefficient note || 1)) / Σ (coefficient note || 1)
                (notes d'examen uniquement : examenId non nul)
moyenneÉlèves(prof) = Σ (moyenneCours × (coef cours || 1)) / Σ (coef cours || 1)
```

Le nombre d'élèves concernés est compté par classe : inscriptions actives de
l'année, à défaut `classe.elevesCount`.

### 6.3 Heures prévues et manquées du professeur

```
heuresPrévues(cours) = Σ durées (§ 4.1) des séances de l'emploi du temps du cours
heuresPrévues(prof)  = Σ heuresPrévues des cours du prof
heuresManquées(prof) =     Σ durées de séance des absences déclarées
                         + Σ max(0, prévu − effectué) des pointages
manque_effectif = min(heuresManquées, heuresPrévues)           (limité aux heures prévues)
```

### 6.4 Note finale

```
composantes = [noteAssiduité, noteRéussite] non nulles
note = Σ composantes / nb composantes           (0 si aucune donnée)
```

Une note de 10/10 exige à la fois 100 % d'heures assurées et des élèves à 20/20.

### 6.5 Remise à zéro annuelle

Toutes les requêtes filtre `anneeId` (cours, EDT, absences, pointages, notes,
inscriptions). À la fin d'une année scolaire rien n'est conservé : la nouvelle
année active repart avec des scores nuls, sans héritage.

---

## 7. Tableau de bord — `src/routes/(app)/dashboard/+page.server.ts`

Périodisation : du début d'année scolaire (par défaut) jusqu'à aujourd'hui,
période ajustable via `?start=` et `?end=`.

### 7.1 Évolution par jour

```
pour chaque jour de la période :
    absences[jour]  = nb d'absences d'élève datées de ce jour
    retards[jour]   = nb de retards idem
    incidents[jour] = nb d'incidents dont `anneeId` correspond, datés de ce jour
```

Groupage par clé ISO locale `AAAA-MM-JJ` (`countByDayKey`, préférence `date` puis `createdAt`).

### 7.2 Présence / absence (graphique en anneau)

```
absentsDistincts = nb d'élèves (identifiants) ayant au moins une absence sur la période
présents = nb d'inscriptions actives − absentsDistincts      (borné à ≥ 0)
```

### 7.3 Justification des absences

```
justifiées   = absences reliées à au moins une ligne de rapport
non justifiées = total absences − justifiées
```

### 7.4 Distribution des notes

Quatre tranches complémentaires (`v` = valeur de note, bornée par défaut) :

```
0 ≤ v < 5   → « 0-5 »
5 ≤ v < 10  → « 5-10 »
10 ≤ v < 15 → « 10-15 »
15 ≤ v      → « 15-20 »
```

(valeurs non numériques ignorées).

### 7.5 Moyennes par classe et globale

```
moyenne classe = round((Σ valeurs / nb notes) × 10) / 10       (1 décimale)
moyenne générale = idem sur toutes les notes de la période
```

### 7.6 Classements et counts

- `incidentsByType` / `incidentsByClass` / `delaysByClass` / `classSizes` : simples comptes
  groupés par type, classe (inscription active de l'élève) ou taille de classe ; triés par
  valeur décroissante.
- `pointagesByOperateur` : compte des pointages de la période dont `operateurId` est renseigné.
- Les graphes en barres affichent `hauteur = max((valeur / max) × 115, 2)` px
  (barres : `barHeight` de `+page.svelte`).

---

## 8. Analyse générale (multi-classes) — `analyse/+page.server.ts`

### 8.1 Moyenne d'une classe

```
moyenne(classe) = Σ (moyenneGenerale(e) > 0 ? moyenneGenerale(e) : 0) / nb élèves
```

### 8.2 Taux de réussite d'une classe

```
taux = round( (nb élèves avec moyenneGenerale ≥ 10) / nb élèves × 100 )
```

### 8.3 Évolution d'examen

```
moyenne(examen) = Σ moyenneGenerale(e, [examen]) / nb valeurs positives
                  (uniquement les moyennes > 0 de cet examen ; 0 si aucune)
```

### 8.4 Classement général

Tri décroissant par `moyenneGenerale` ; rang = position (1-based).

---

## 9. Statistiques de profil — `EmployeeStats`

Fiche enseignant / surveillant (`src/lib/types/Personne.type.ts`,
`enseignant/[id]`, `surveillant/[id]`). Les compteurs sont dessimples
comptes **de l'année** :

```
retards, absences, incidents, notesPositives, notesNegatives : compte par type
nbCours : nb de cours menés par la personne
```

---

## 10. Rappels d'invariants

1. **Pondération** : toute moyenne de matière ou générale est pondérée par
   coefficient (`note.coefficient`, sinon `cours.coefficient`).
2. **Participants vides** = cours de toute la classe dans `utils/analyse.ts`,
   mais pas dans le bulletin (§ 2.4).
3. **Notes d'examen** : seules les notes rattachées à un examen (`examenId`
   non nul) et, sur le bulletin, à un sous-examen, sont prises en compte.
4. **Année scolaire** : tous les calculs d'assiduité, d'évaluation et de
   moyennes des pages analyse sont scopés sur l'année active.
5. **Niveau d'évaluation des enseignants** : borné par `clamp10` (0–10) ; les heures
   manquées ne peuvent pas dépasser les heures prévues (§ 6.3).
