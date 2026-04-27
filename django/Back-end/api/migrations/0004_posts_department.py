from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0003_students_ncin'),
    ]

    operations = [
        migrations.AddField(
            model_name='posts',
            name='department',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='announcements',
                to='api.departments',
            ),
        ),
    ]
