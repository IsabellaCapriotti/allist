# Generated by Django 3.1.7 on 2021-03-19 22:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('watchlist', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='listitem',
            name='dateFinished',
            field=models.DateField(blank=True, null=True),
        ),
    ]