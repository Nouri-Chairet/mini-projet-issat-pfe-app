from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0007_bootstrap_departments_table"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS schedules (
                id uuid PRIMARY KEY,
                teacher_id uuid NOT NULL REFERENCES teachers(user_id) ON DELETE CASCADE,
                class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
                day_of_week varchar(10) NOT NULL,
                start_time time NOT NULL,
                end_time time NOT NULL,
                room text NOT NULL,
                subject text NOT NULL
            );
            CREATE INDEX IF NOT EXISTS schedules_teacher_idx ON schedules(teacher_id);
            CREATE INDEX IF NOT EXISTS schedules_class_idx ON schedules(class_id);
            CREATE INDEX IF NOT EXISTS schedules_day_time_idx ON schedules(day_of_week, start_time, end_time);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS schedules_day_time_idx;
            DROP INDEX IF EXISTS schedules_class_idx;
            DROP INDEX IF EXISTS schedules_teacher_idx;
            DROP TABLE IF EXISTS schedules;
            """,
        )
    ]
