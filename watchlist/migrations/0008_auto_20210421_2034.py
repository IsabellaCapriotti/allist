# Generated by Django 3.1.7 on 2021-04-22 03:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('watchlist', '0007_auto_20210416_2007'),
    ]

    operations = [
        migrations.RenameField(
            model_name='profileactivity',
            old_name='postType',
            new_name='activityType',
        ),
        migrations.AddField(
            model_name='profileactivity',
            name='itemType',
            field=models.CharField(choices=[('w', 'watch'), ('r', 'read'), ('t', 'try'), ('p', 'play'), ('l', 'listen')], default='w', max_length=6),
        ),
    ]
