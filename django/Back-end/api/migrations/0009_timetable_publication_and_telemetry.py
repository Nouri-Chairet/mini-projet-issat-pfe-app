from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0008_bootstrap_schedules_table"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS timetable_publications (
                id uuid PRIMARY KEY,
                is_published boolean NOT NULL DEFAULT false,
                published_at timestamp with time zone NULL,
                published_by_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
                updated_at timestamp with time zone NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS timetable_telemetry (
                id uuid PRIMARY KEY,
                user_id uuid NULL REFERENCES users(id) ON DELETE SET NULL,
                role varchar(20) NULL,
                event_name varchar(120) NOT NULL,
                route varchar(180) NULL,
                payload jsonb NULL,
                created_at timestamp with time zone NOT NULL DEFAULT NOW()
            );

            CREATE INDEX IF NOT EXISTS timetable_telemetry_event_idx
                ON timetable_telemetry(event_name, created_at);
            """,
            reverse_sql="""
            DROP INDEX IF EXISTS timetable_telemetry_event_idx;
            DROP TABLE IF EXISTS timetable_telemetry;
            DROP TABLE IF EXISTS timetable_publications;
            """,
        )
    ]
