export const users = [
  { id: 1, name: "Prof. Karim Mansouri", role: "chef", avatar: "KM", email: "k.mansouri@univ.tn", password: "chef123", department: "Informatique" },
  { id: 2, name: "Dr. Sonia Kchaou", role: "enseignant", avatar: "SK", email: "s.kchaou@univ.tn", password: "ens123", specialite: "Machine Learning", nbSujets: 2 },
  { id: 3, name: "Amira Belhaj", role: "etudiant", avatar: "AB", email: "a.belhaj@univ.tn", password: "etu123", sujetId: 1 },
];

export const sujets = [
  { id: 1, titre: "Système de détection d'intrusion par deep learning", etudiant: { id: 3, name: "Amira Belhaj", avatar: "AB", email: "a.belhaj@univ.tn" }, encadreur: { id: 2, name: "Dr. Sonia Kchaou", avatar: "SK" }, statut: "planifié", datePresentation: "2025-06-15", heure: "09:00", salle: "Salle A1", jury: [{ id: 4, name: "Prof. Hedi Trabelsi", role: "président" }, { id: 5, name: "Dr. Leila Ferchichi", role: "rapporteur" }] },
  { id: 2, titre: "Application mobile de gestion des ressources hospitalières", etudiant: { id: 6, name: "Youssef Chaabane", avatar: "YC", email: "y.chaabane@univ.tn" }, encadreur: { id: 4, name: "Prof. Hedi Trabelsi", avatar: "HT" }, statut: "en attente", datePresentation: null, heure: null, salle: null, jury: [] },
  { id: 3, titre: "Plateforme e-learning adaptative basée sur l'IA", etudiant: { id: 7, name: "Fatma Riahi", avatar: "FR", email: "f.riahi@univ.tn" }, encadreur: { id: 5, name: "Dr. Leila Ferchichi", avatar: "LF" }, statut: "planifié", datePresentation: "2025-06-16", heure: "10:30", salle: "Salle B2", jury: [{ id: 2, name: "Dr. Sonia Kchaou", role: "président" }, { id: 6, name: "Dr. Mehdi Jouini", role: "rapporteur" }] },
  { id: 4, titre: "Blockchain pour la gestion des diplômes universitaires", etudiant: { id: 8, name: "Rami Gharbi", avatar: "RG", email: "r.gharbi@univ.tn" }, encadreur: { id: 6, name: "Dr. Mehdi Jouini", avatar: "MJ" }, statut: "validé", datePresentation: "2025-06-10", heure: "14:00", salle: "Salle C3", jury: [{ id: 4, name: "Prof. Hedi Trabelsi", role: "président" }, { id: 2, name: "Dr. Sonia Kchaou", role: "rapporteur" }] },
  { id: 5, titre: "Système de recommandation de cours en ligne", etudiant: { id: 9, name: "Ines Hamdi", avatar: "IH", email: "i.hamdi@univ.tn" }, encadreur: { id: 2, name: "Dr. Sonia Kchaou", avatar: "SK" }, statut: "en attente", datePresentation: null, heure: null, salle: null, jury: [] },
];

export const enseignants = [
  { id: 2, name: "Dr. Sonia Kchaou", avatar: "SK", specialite: "Machine Learning", nbSujets: 2, disponibilites: ["2025-06-15", "2025-06-16", "2025-06-17"] },
  { id: 4, name: "Prof. Hedi Trabelsi", avatar: "HT", specialite: "Réseaux & Sécurité", nbSujets: 1, disponibilites: ["2025-06-15", "2025-06-18"] },
  { id: 5, name: "Dr. Leila Ferchichi", avatar: "LF", specialite: "Intelligence Artificielle", nbSujets: 1, disponibilites: ["2025-06-16", "2025-06-17", "2025-06-19"] },
  { id: 6, name: "Dr. Mehdi Jouini", avatar: "MJ", specialite: "Base de données", nbSujets: 1, disponibilites: ["2025-06-17", "2025-06-18"] },
];

export const forumMessages = [
  { id: 1, auteur: { name: "Amira Belhaj", avatar: "AB", role: "etudiant" }, sujet: "Structure du rapport final", message: "Bonjour, quelle est la structure recommandée pour le rapport final de PFE ?", date: "2025-05-20", reponses: [{ id: 11, auteur: { name: "Dr. Sonia Kchaou", avatar: "SK", role: "enseignant" }, message: "Le rapport doit comporter : introduction, état de l'art, conception, réalisation et conclusion.", date: "2025-05-20" }] },
  { id: 2, auteur: { name: "Youssef Chaabane", avatar: "YC", role: "etudiant" }, sujet: "Délai de soumission du rapport", message: "Quand est la date limite pour la soumission du rapport ?", date: "2025-05-22", reponses: [] },
  { id: 3, auteur: { name: "Prof. Hedi Trabelsi", avatar: "HT", role: "enseignant" }, sujet: "Conseils pour la présentation orale", message: "Rappel : 20 minutes de présentation + 10 minutes de questions. Préparez vos slides et respectez le timing.", date: "2025-05-25", reponses: [{ id: 31, auteur: { name: "Fatma Riahi", avatar: "FR", role: "etudiant" }, message: "Merci Professeur ! Y a-t-il un nombre de slides recommandé ?", date: "2025-05-25" }] },
];