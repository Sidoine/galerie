# Galerie photo

Lancer la galerie sur Docker :

```
    docker build -t galerie .
    docker run --rm -p 5000:5000 --env DATABASE_URL=postgres://postgres:plop@192.168.2.77:5433/galerie galerie
```

## Fonctionnalité reconnaissance faciale

Une page liste désormais les noms de visages détectés dans une galerie: `/g/:galleryId/face-names`.

Chaque nom est cliquable et mène à la page listant toutes les photos contenant ce visage: `/g/:galleryId/face-names/:faceNameId`.

L'endpoint backend utilisé est `GET /api/gallery/{galleryId}/face-names/{id}/photos` qui retourne un tableau de `PhotoViewModel`.
