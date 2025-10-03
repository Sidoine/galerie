import React from "react";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Link } from "expo-router";

/**
 * Page Politique de Confidentialité
 * Exposée à l'URL /privacy (Google Play exige une URL publique)
 */
export default function PrivacyPolicyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Politique de confidentialité</Text>
      <Text style={styles.updated}>Dernière mise à jour : 3 octobre 2025</Text>

      <Section title="1. Objet de l'application">
        L'application Galerie Photos permet aux utilisateurs autorisés de
        stocker, organiser et consulter des photos et des vidéos au sein de
        galeries privées. Certaines fonctionnalités incluent la reconnaissance
        de visages, la géolocalisation des prises de vue et la gestion de
        membres (rôles & permissions).
      </Section>

      <Section title="2. Données collectées">
        <Bullet>
          Informations de compte : nom, adresse e-mail (nécessaires à
          l'authentification et aux notifications).
        </Bullet>
        <Bullet>
          Métadonnées des photos : date, format, dimensions, coordonnées GPS si
          disponibles.
        </Bullet>
        <Bullet>
          Visages détectés : empreintes faciales (vecteurs non réversibles)
          utilisées uniquement pour l'association automatique; aucune image
          biométrique brute n'est conservée en dehors des photos elles‑mêmes.
        </Bullet>
        <Bullet>
          Journaux techniques : événements d'erreur, temps de réponse, adresses
          IP (à des fins de sécurité et diagnostic).
        </Bullet>
      </Section>

      <Section title="3. Finalités de traitement">
        <Bullet>Fournir l'accès sécurisé aux galeries.</Bullet>
        <Bullet>Améliorer l'expérience de recherche (visages, lieux).</Bullet>
        <Bullet>
          Surveiller la stabilité et la sécurité de la plateforme.
        </Bullet>
      </Section>

      <Section title="4. Base légale (RGPD)">
        <Bullet>
          Exécution du contrat : fourniture des fonctionnalités principales.
        </Bullet>
        <Bullet>Intérêt légitime : amélioration produit & sécurité.</Bullet>
        <Bullet>
          Consentement : fonctionnalités optionnelles (ex. géolocalisation si
          activée par l'utilisateur).
        </Bullet>
      </Section>

      <Section title="5. Stockage & sécurité">
        <Bullet>
          Données hébergées sur des serveurs sécurisés (chiffrement en transit
          TLS).
        </Bullet>
        <Bullet>Accès restreint par authentification et rôles.</Bullet>
        <Bullet>
          Sauvegardes régulières et journalisation des accès sensibles.
        </Bullet>
      </Section>

      <Section title="6. Partage des données">
        Nous ne vendons ni ne louons vos données. Les données peuvent être
        transférées à des sous-traitants techniques (hébergement, sauvegarde)
        strictement nécessaires au service, liés par des accords de protection
        des données.
      </Section>

      <Section title="7. Conservation">
        <Bullet>
          Données de compte : conservées tant que le compte est actif.
        </Bullet>
        <Bullet>
          Photos & métadonnées : conservées jusqu'à suppression par un
          administrateur.
        </Bullet>
        <Bullet>
          Journaux techniques : rotation automatique (généralement ≤ 90 jours).
        </Bullet>
      </Section>

      <Section title="8. Droits des utilisateurs (UE)">
        <Bullet>Accès, rectification, suppression.</Bullet>
        <Bullet>Limitation & opposition.</Bullet>
        <Bullet>
          Portabilité (sur demande export structurée des métadonnées
          disponibles).
        </Bullet>
        Pour exercer vos droits, contactez : support@example.com
      </Section>

      <Section title="9. Reconnaissance faciale">
        La détection/association des visages sert uniquement à regrouper les
        photos. Les descripteurs générés ne permettent pas de reconstituer un
        visage. Vous pouvez demander la suppression de tous les descripteurs
        associés à une personne identifiée.
      </Section>

      <Section title="10. Transferts hors UE">
        Si les serveurs ou sous‑traitants sont situés hors de l'UE, des
        garanties adéquates (clauses contractuelles types, pays adéquats) sont
        mises en place.
      </Section>

      <Section title="11. Mises à jour de cette politique">
        Toute modification substantielle sera annoncée dans l'application. La
        poursuite de l'utilisation vaut acceptation de la version mise à jour.
      </Section>

      <Section title="12. Contact">
        Pour toute question ou demande liée à la confidentialité :
        support@example.com
      </Section>

      <View style={styles.footer}>
        <Link href="/(app)/gallery/choose">← Retour à l'accueil</Link>
      </View>
    </ScrollView>
  );
}

function Section(props: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{props.title}</Text>
      <Text style={styles.sectionText}>{props.children}</Text>
    </View>
  );
}

function Bullet(props: { children: React.ReactNode }) {
  return (
    <Text style={styles.bullet}>
      {"\u2022 "}
      {props.children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 16 },
  title: { fontSize: 28, fontWeight: "700" },
  updated: { fontSize: 12, color: "#555" },
  section: { gap: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 12 },
  sectionText: { fontSize: 14, lineHeight: 20 },
  bullet: { fontSize: 14, lineHeight: 20, marginLeft: 8 },
  footer: { marginTop: 32 },
});
