"""
Generate sample Excel files for testing the import endpoints.

Usage (from the Back-end/ directory):
    python scripts/generate_samples.py

Output files:
    scripts/samples/students_sample.xlsx
    scripts/samples/teachers_sample.xlsx
    scripts/samples/schedule_sample.xlsx

Notes
-----
- students_sample.xlsx   : 18 students across 3 classes, 2 with intentional errors
- teachers_sample.xlsx   : 16 teachers across 4 departments, 2 with intentional errors
- schedule_sample.xlsx   : 20 valid slots + 2 rows that contain conflicts (for testing)
"""
from pathlib import Path

import pandas as pd

OUTPUT_DIR = Path(__file__).parent / "samples"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Students
# ---------------------------------------------------------------------------

STUDENT_CLASSES = ["1-Prépa-1", "1-Prépa-2", "2-L-LSI-1"]

STUDENTS = [
    # valid rows
    {"cin": "10000001", "first_name": "Amira", "last_name": "Ben Salah", "email": "amira.bensalah@student.isimg.tn", "class": "1-Prépa-1", "phone": "22334455"},
    {"cin": "10000002", "first_name": "Yassine", "last_name": "Hamdi", "email": "yassine.hamdi@student.isimg.tn", "class": "1-Prépa-1", "phone": "22334456"},
    {"cin": "10000003", "first_name": "Salma", "last_name": "Jebali", "email": "salma.jebali@student.isimg.tn", "class": "1-Prépa-1", "phone": "22334457"},
    {"cin": "10000004", "first_name": "Khalil", "last_name": "Mansour", "email": "khalil.mansour@student.isimg.tn", "class": "1-Prépa-1", "phone": "22334458"},
    {"cin": "10000005", "first_name": "Ines", "last_name": "Trabelsi", "email": "ines.trabelsi@student.isimg.tn", "class": "1-Prépa-2", "phone": "22334459"},
    {"cin": "10000006", "first_name": "Omar", "last_name": "Ghribi", "email": "omar.ghribi@student.isimg.tn", "class": "1-Prépa-2", "phone": "22334460"},
    {"cin": "10000007", "first_name": "Nour", "last_name": "Ayari", "email": "nour.ayari@student.isimg.tn", "class": "1-Prépa-2", "phone": "22334461"},
    {"cin": "10000008", "first_name": "Hazem", "last_name": "Elloumi", "email": "hazem.elloumi@student.isimg.tn", "class": "1-Prépa-2", "phone": "22334462"},
    {"cin": "10000009", "first_name": "Sarra", "last_name": "Boughanmi", "email": "sarra.boughanmi@student.isimg.tn", "class": "2-L-LSI-1", "phone": "22334463"},
    {"cin": "10000010", "first_name": "Mehdi", "last_name": "Sfaxi", "email": "mehdi.sfaxi@student.isimg.tn", "class": "2-L-LSI-1", "phone": "22334464"},
    {"cin": "10000011", "first_name": "Chaima", "last_name": "Nasr", "email": "chaima.nasr@student.isimg.tn", "class": "2-L-LSI-1", "phone": "22334465"},
    {"cin": "10000012", "first_name": "Bilel", "last_name": "Driss", "email": "bilel.driss@student.isimg.tn", "class": "2-L-LSI-1", "phone": "22334466"},
    {"cin": "10000013", "first_name": "Rania", "last_name": "Keskes", "email": "rania.keskes@student.isimg.tn", "class": "1-Prépa-1", "phone": "22334467"},
    {"cin": "10000014", "first_name": "Firas", "last_name": "Tlili", "email": "firas.tlili@student.isimg.tn", "class": "1-Prépa-2", "phone": "22334468"},
    {"cin": "10000015", "first_name": "Yasmine", "last_name": "Chaouch", "email": "yasmine.chaouch@student.isimg.tn", "class": "2-L-LSI-1", "phone": "22334469"},
    {"cin": "10000016", "first_name": "Amir", "last_name": "Zarrouk", "email": "amir.zarrouk@student.isimg.tn", "class": "1-Prépa-1", "phone": "22334470"},
    # intentional errors (for testing)
    {"cin": "BADCIN!!", "first_name": "Error", "last_name": "CIN", "email": "error.cin@student.isimg.tn", "class": "1-Prépa-1", "phone": ""},
    {"cin": "10000018", "first_name": "Error", "last_name": "Email", "email": "not-an-email", "class": "1-Prépa-1", "phone": ""},
]

df_students = pd.DataFrame(STUDENTS, columns=["cin", "first_name", "last_name", "email", "class", "phone"])
df_students.to_excel(OUTPUT_DIR / "students_sample.xlsx", index=False)
print(f"✓ students_sample.xlsx  — {len(STUDENTS)} rows ({len(STUDENTS)-2} valid, 2 error)")


# ---------------------------------------------------------------------------
# Teachers
# ---------------------------------------------------------------------------

TEACHERS = [
    {"cin": "20000001", "first_name": "Riadh", "last_name": "Ben Ali", "email": "riadh.benali@isimg.tn", "department": "Informatique", "age": 45},
    {"cin": "20000002", "first_name": "Sonia", "last_name": "Khediri", "email": "sonia.khediri@isimg.tn", "department": "Informatique", "age": 38},
    {"cin": "20000003", "first_name": "Tarek", "last_name": "Ferjani", "email": "tarek.ferjani@isimg.tn", "department": "Informatique", "age": 52},
    {"cin": "20000004", "first_name": "Hanen", "last_name": "Bouri", "email": "hanen.bouri@isimg.tn", "department": "Informatique", "age": 41},
    {"cin": "20000005", "first_name": "Walid", "last_name": "Saad", "email": "walid.saad@isimg.tn", "department": "Electronique", "age": 47},
    {"cin": "20000006", "first_name": "Sabrine", "last_name": "Mezghani", "email": "sabrine.mezghani@isimg.tn", "department": "Electronique", "age": 35},
    {"cin": "20000007", "first_name": "Mondher", "last_name": "Karray", "email": "mondher.karray@isimg.tn", "department": "Electronique", "age": 55},
    {"cin": "20000008", "first_name": "Asma", "last_name": "Jrad", "email": "asma.jrad@isimg.tn", "department": "Electronique", "age": 40},
    {"cin": "20000009", "first_name": "Hatem", "last_name": "Bouazizi", "email": "hatem.bouazizi@isimg.tn", "department": "Génie Civil", "age": 50},
    {"cin": "20000010", "first_name": "Fatma", "last_name": "Dhouib", "email": "fatma.dhouib@isimg.tn", "department": "Génie Civil", "age": 43},
    {"cin": "20000011", "first_name": "Nabil", "last_name": "Zouari", "email": "nabil.zouari@isimg.tn", "department": "Génie Civil", "age": 37},
    {"cin": "20000012", "first_name": "Lamia", "last_name": "Romdhane", "email": "lamia.romdhane@isimg.tn", "department": "Génie Civil", "age": 48},
    {"cin": "20000013", "first_name": "Karim", "last_name": "Mellouli", "email": "karim.mellouli@isimg.tn", "department": "Mathématiques", "age": 44},
    {"cin": "20000014", "first_name": "Mariem", "last_name": "Belhadj", "email": "mariem.belhadj@isimg.tn", "department": "Mathématiques", "age": 39},
    # intentional errors
    {"cin": "20000015", "first_name": "Error", "last_name": "Age", "email": "error.age@isimg.tn", "department": "Informatique", "age": 15},
    {"cin": "BAD-CIN", "first_name": "Error", "last_name": "CIN", "email": "error.cin@isimg.tn", "department": "Informatique", "age": 35},
]

df_teachers = pd.DataFrame(TEACHERS, columns=["cin", "first_name", "last_name", "email", "department", "age"])
df_teachers.to_excel(OUTPUT_DIR / "teachers_sample.xlsx", index=False)
print(f"✓ teachers_sample.xlsx  — {len(TEACHERS)} rows ({len(TEACHERS)-2} valid, 2 error)")


# ---------------------------------------------------------------------------
# Schedule (timetable)
# Columns: jour, heure-debut, heure-fin, matiere, professeur, classe, salle
# professeur is matched by Users.username in the system.
# ---------------------------------------------------------------------------

# NOTE: The professeur values must match exactly a teacher's username in the DB.
# Change them to match your seed data before running a live commit.

SCHEDULE = [
    # --- Lundi ---
    {"jour": "Lundi", "heure-debut": "08:00", "heure-fin": "10:00", "matiere": "Analyse", "professeur": "Riadh Ben Ali", "classe": "1-Prépa-1", "salle": "A101"},
    {"jour": "Lundi", "heure-debut": "10:00", "heure-fin": "12:00", "matiere": "Algèbre", "professeur": "Karim Mellouli", "classe": "1-Prépa-1", "salle": "A101"},
    {"jour": "Lundi", "heure-debut": "13:00", "heure-fin": "15:00", "matiere": "Physique", "professeur": "Walid Saad", "classe": "1-Prépa-1", "salle": "B201"},
    {"jour": "Lundi", "heure-debut": "08:00", "heure-fin": "10:00", "matiere": "Analyse", "professeur": "Sonia Khediri", "classe": "1-Prépa-2", "salle": "A102"},
    {"jour": "Lundi", "heure-debut": "10:00", "heure-fin": "12:00", "matiere": "Algèbre", "professeur": "Mariem Belhadj", "classe": "1-Prépa-2", "salle": "A102"},
    # --- Mardi ---
    {"jour": "Mardi", "heure-debut": "08:00", "heure-fin": "10:00", "matiere": "Informatique", "professeur": "Riadh Ben Ali", "classe": "1-Prépa-1", "salle": "Lab1"},
    {"jour": "Mardi", "heure-debut": "10:00", "heure-fin": "12:00", "matiere": "Electronique", "professeur": "Walid Saad", "classe": "1-Prépa-1", "salle": "Lab2"},
    {"jour": "Mardi", "heure-debut": "08:00", "heure-fin": "10:00", "matiere": "Informatique", "professeur": "Tarek Ferjani", "classe": "1-Prépa-2", "salle": "Lab3"},
    {"jour": "Mardi", "heure-debut": "13:00", "heure-fin": "15:00", "matiere": "Dessin Technique", "professeur": "Hatem Bouazizi", "classe": "1-Prépa-2", "salle": "C301"},
    # --- Mercredi ---
    {"jour": "Mercredi", "heure-debut": "08:00", "heure-fin": "10:00", "matiere": "Analyse", "professeur": "Riadh Ben Ali", "classe": "2-L-LSI-1", "salle": "A201"},
    {"jour": "Mercredi", "heure-debut": "10:00", "heure-fin": "12:00", "matiere": "Réseaux", "professeur": "Sonia Khediri", "classe": "2-L-LSI-1", "salle": "Lab1"},
    {"jour": "Mercredi", "heure-debut": "13:00", "heure-fin": "15:00", "matiere": "BD", "professeur": "Tarek Ferjani", "classe": "2-L-LSI-1", "salle": "Lab2"},
    # --- Jeudi ---
    {"jour": "jeudi", "heure-debut": "08:00", "heure-fin": "10:00", "matiere": "Circuits", "professeur": "Mondher Karray", "classe": "1-Prépa-1", "salle": "B101"},
    {"jour": "jeudi", "heure-debut": "10:00", "heure-fin": "12:00", "matiere": "Signal", "professeur": "Sabrine Mezghani", "classe": "1-Prépa-1", "salle": "B102"},
    {"jour": "jeudi", "heure-debut": "08:00", "heure-fin": "10:00", "matiere": "Circuits", "professeur": "Asma Jrad", "classe": "1-Prépa-2", "salle": "B201"},
    {"jour": "jeudi", "heure-debut": "13:00", "heure-fin": "15:00", "matiere": "Anglais", "professeur": "Hanen Bouri", "classe": "2-L-LSI-1", "salle": "D401"},
    # --- Vendredi ---
    {"jour": "Vendredi", "heure-debut": "08:00", "heure-fin": "10:00", "matiere": "Probabilités", "professeur": "Karim Mellouli", "classe": "2-L-LSI-1", "salle": "A202"},
    {"jour": "Vendredi", "heure-debut": "10:00", "heure-fin": "12:00", "matiere": "Systèmes", "professeur": "Riadh Ben Ali", "classe": "2-L-LSI-1", "salle": "Lab1"},
    {"jour": "Vendredi", "heure-debut": "13:00", "heure-fin": "15:00", "matiere": "TP Labo", "professeur": "Sonia Khediri", "classe": "1-Prépa-1", "salle": "Lab3"},
    {"jour": "Vendredi", "heure-debut": "13:00", "heure-fin": "15:00", "matiere": "TP Labo", "professeur": "Tarek Ferjani", "classe": "1-Prépa-2", "salle": "Lab4"},
    # --- Conflict rows (same teacher, overlapping times, same day) ---
    {"jour": "Lundi", "heure-debut": "08:30", "heure-fin": "10:30", "matiere": "CONFLICT", "professeur": "Riadh Ben Ali", "classe": "2-L-LSI-1", "salle": "Z999"},
    {"jour": "Mardi", "heure-debut": "09:00", "heure-fin": "11:00", "matiere": "CONFLICT", "professeur": "Walid Saad", "classe": "1-Prépa-2", "salle": "Z999"},
]

df_schedule = pd.DataFrame(SCHEDULE, columns=["jour", "heure-debut", "heure-fin", "matiere", "professeur", "classe", "salle"])
df_schedule.to_excel(OUTPUT_DIR / "schedule_sample.xlsx", index=False)
print(f"✓ schedule_sample.xlsx  — {len(SCHEDULE)} rows ({len(SCHEDULE)-2} valid, 2 conflict)")

print()
print("Sample files written to:", OUTPUT_DIR.resolve())
print()
print("How to use:")
print("  1. Run migrations:  python manage.py migrate")
print("  2. Upload students: POST /api/admin/import/students/  with file=students_sample.xlsx")
print("  3. Upload teachers: POST /api/admin/import/teachers/  with file=teachers_sample.xlsx")
print("  4. Dry-run schedule: POST /api/admin/timetable/import/dry-run/  with file=schedule_sample.xlsx")
print("     (last 2 rows are intentional conflicts — expect non-empty 'conflicts' in response)")
