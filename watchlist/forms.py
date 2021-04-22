from django.forms import ModelForm
from .models import ListItem

class ListItemForm(ModelForm):
    class Meta:
        model = ListItem
        fields = ['title', 'url', 'notes', 'isProfileHidden']
        labels = {
            'isProfileHidden': 'Hide on profile?'
        }