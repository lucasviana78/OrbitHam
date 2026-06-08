from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('satellites', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='satellite',
            name='downlink_mhz',
            field=models.FloatField(blank=True, null=True),
        ),
    ]
