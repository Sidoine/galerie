# Galerie photo

Lancer la galerie sur Docker :

```
    docker build -t galerie .
    docker run --rm -p 5000:5000 --env DATABASE_URL=postgres://postgres:plop@192.168.2.77:5433/galerie galerie
```
