from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0005_alter_attendance_options_alter_posts_options"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS classes (
                id uuid PRIMARY KEY,
                niveau text NOT NULL,
                classe_section varchar(40) NOT NULL,
                classe_num text NOT NULL
            );

            CREATE TABLE IF NOT EXISTS teachers (
                user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                department text NOT NULL,
                ncin varchar(8) NOT NULL,
                age integer NOT NULL
            );

            CREATE TABLE IF NOT EXISTS students (
                user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                class_id uuid NULL REFERENCES classes(id) ON DELETE CASCADE,
                parent_contact varchar(8) NULL,
                access_status boolean NOT NULL DEFAULT TRUE
            );

            CREATE INDEX IF NOT EXISTS students_class_id_idx ON students(class_id);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS students_class_id_idx;
            DROP TABLE IF EXISTS students;
            DROP TABLE IF EXISTS teachers;
            DROP TABLE IF EXISTS classes;
            """,
        )
    ]
