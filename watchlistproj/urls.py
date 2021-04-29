from django.contrib import admin
from django.urls import path

from watchlist import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home, name='home'),
    path('signup/', views.signup, name='signup'),
    path('signin/', views.signin, name='signin'),
    path('lists/', views.listcolumns, name='listcolumns'),
    path('additem/', views.additem, name='additem'),
    path('getitem/<int:itemid>/', views.getitem, name='getitem'),
    path('markcomplete/<int:itemid>/', views.markcomplete, name='markcomplete'),
    path('deleteitem/<int:itemid>/', views.deleteitem, name='deleteitem'),
    path('edititem/', views.edititem, name='edititem'),
    path('profile/<str:username>/', views.profile, name='profile'),
    path('findbyquery/', views.findItemsByQuery, name='findbyquery'),
    path('edituserinfo/', views.edituserinfo, name='edituserinfo'),
    path('logout/', views.logout_view, name='logout'),
    path('getuserinfo/', views.getuserinfo, name='getuserinfo'),
    path('changeun/', views.change_un, name='change_un')
]
