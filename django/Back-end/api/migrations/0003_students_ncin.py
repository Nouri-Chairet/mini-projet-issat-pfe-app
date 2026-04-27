from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_pfecampaigns_status_studentnotifications_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='students',
            name='ncin',
            field=models.CharField(
                blank=True,
                max_length=8,
                null=True,
                unique=True,
                validators=[django.core.validators.RegexValidator(
                    regex='^\\d{8}$',
                    message='NCIN must be exactly 8 numerical digits',
                )],
            ),
        ),
    ]
