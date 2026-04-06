from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0006_bootstrap_core_tables"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS departments (
                id uuid PRIMARY KEY,
                name varchar(120) UNIQUE NOT NULL,
                head_id uuid UNIQUE NULL REFERENCES teachers(user_id) ON DELETE SET NULL,
                created_at timestamp with time zone NOT NULL DEFAULT NOW()
            );
            """,
            reverse_sql="""
            DROP TABLE IF EXISTS departments;
            """,
        )
    ]
