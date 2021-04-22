# Generated by Django 3.1.7 on 2021-03-17 00:40

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ListItem',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('itemType', models.CharField(choices=[('w', 'watch'), ('r', 'read'), ('t', 'try'), ('p', 'play'), ('l', 'listen')], max_length=6)),
                ('title', models.CharField(max_length=200)),
                ('url', models.URLField(blank=True)),
                ('notes', models.TextField(blank=True)),
                ('dateFinished', models.DateField(blank=True)),
                ('isArchived', models.BooleanField(blank=True, default=False)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]