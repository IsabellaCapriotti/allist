from django.db import models
from django.contrib.auth.models import User

class ListItem(models.Model):

    typeChoices = [('w', 'watch'), ('r', 'read'), ('t', 'try'), ('p', 'play'), ('l', 'listen')]
    itemType = models.CharField(max_length=6, choices=typeChoices)
    title = models.CharField(max_length=200)
    url = models.URLField(blank=True)
    notes = models.TextField(blank=True)
    dateFinished = models.DateField(blank=True, null=True)
    dateAdded = models.DateField(blank=True, null=True)
    isArchived = models.BooleanField(default=False)
    isProfileHidden = models.BooleanField(default=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)     

    def __str__(self):
        return self.title

class UserProfileInfo(models.Model):
    status = models.CharField(max_length=400, blank=True)
    itemsCompleted = models.IntegerField(default=0)
    themeChoices = [('o', 'orange'), ('p', 'purple'), ('b', 'blue'), ('g', 'green')]
    colorTheme = models.CharField(max_length=15, choices=themeChoices, default='o')

    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True)

class ProfileActivity(models.Model):
    date = models.DateField(blank=True, null=True)
    activityType = models.CharField(choices=[('f','finished'), ('s', 'started')], max_length=1)
    itemName = models.CharField(max_length=200)
    typeChoices = [('w', 'watch'), ('r', 'read'), ('t', 'try'), ('p', 'play'), ('l', 'listen')]
    itemType = models.CharField(max_length=6, choices=typeChoices, default='w')
    hidden = models.BooleanField(default=False)

    listItem = models.ForeignKey(ListItem, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.itemName + " " + self.activityType