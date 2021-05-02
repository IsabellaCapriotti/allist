from django.shortcuts import render
from django.contrib.auth.models import User
from django.contrib.auth import login, authenticate, logout
from django.db import IntegrityError
from django.shortcuts import redirect
from django.http import HttpResponse, JsonResponse
from django.core import serializers

from .models import ListItem, UserProfileInfo, ProfileActivity
from .forms import ListItemForm

from datetime import date
import random
import re

############################################################################
# HOME PAGE AND LISTS PAGE
# Home page (redirects to sign up if not logged in, list page if logged in)
def home(request): 

    if(request.user.is_authenticated):
        return redirect('/lists/')
    else:
        return redirect('/signup/')

# Lists page
def listcolumns(request):

    # Only show information for logged in users
    if(request.user.is_authenticated):
        
        context = {}

        # Query database to get all list items for the current user
        user = request.user

        watchList = ListItem.objects.filter(itemType='w', user_id=user.id, isArchived=False)
        context['watchList'] = watchList

        readList = ListItem.objects.filter(itemType='r', user_id=user.id, isArchived=False)
        context['readList'] = readList

        tryList = ListItem.objects.filter(itemType='t', user_id=user.id, isArchived=False)
        context['tryList'] = tryList

        playList = ListItem.objects.filter(itemType='p', user_id=user.id, isArchived=False)
        context['playList'] = playList

        listenList = ListItem.objects.filter(itemType='l', user_id=user.id, isArchived=False)
        context['listenList'] = listenList

        # Create form to render on page
        newForm = ListItemForm()
        editForm = ListItemForm(auto_id='edit_%s')
        context['listItemForm'] = newForm 
        context['editForm'] = editForm

        # Pass in username for user in profile generation
        context['username'] = request.user.username

        return render(request, 'watchlist/listcolumns.html', context=context)

        
    else:
        return redirect('/signup/')
############################################################################




############################################################################
# AUTHENTICATION
# Signup page
def signup(request):

    # If user was already signed in, redirect to lists page
    if request.user.is_authenticated:
        return redirect('/lists/')

    # Handle POST request (attempt to create new account)
    if request.method == 'POST':
        userData = request.POST

        # Check that username and password are valid
        if not isValidUsernameOrPassword(userData['username']):
            return render(request, 'watchlist/signup.html', {'errorMessage': 'Please enter a username containing between 3 and 30 alphanumeric characters.'})
        elif not isValidUsernameOrPassword(userData['password'], True):
            return render(request, 'watchlist/signup.html', {'errorMessage': 'Please enter a password containing between 10 and 30 alphanumeric characters.'})


        # Create new user and log them in 
        # Create the new settings profile as well 
        try:
            newUser = User.objects.create_user(userData['username'], password=userData['password'])
            newProfileSettings = UserProfileInfo.objects.create(user=newUser)
            login(request, newUser)

        # If the user already existed, show an error message
        except IntegrityError: 
            return render(request, 'watchlist/signup.html', {'errorMessage': 'That username already exists!'})

        # For a successful account creation, redirect to the lists page
        return redirect('/lists/')

    # If this was not a POST request, just display the blank sign up form
    return render(request, 'watchlist/signup.html')

# Signin page
def signin(request):

    # If user was already signed in, redirect to lists page
    if request.user.is_authenticated:
        return redirect('/lists/')
        
    # For POST request, attempt to log the user in 
    if request.method == 'POST':
        user = authenticate(username=request.POST['username'], password=request.POST['password'])

        if user is not None:
            login(request, user)
            return redirect('/lists/')
        else:
            return render(request, 'watchlist/signin.html', {'errorMessage': 'A profile matching that username and password was not found.'})

    return render(request, 'watchlist/signin.html')


# View to log out user
def logout_view(request):
    logout(request)
    return HttpResponse("logged out user")

# Change username
def change_un(request):

    # Redirect if not authenticated
    if not request.user.is_authenticated:
        return redirect('/signup/')

    # Get current user and requested username
    currUser = request.user
    newUN = request.POST['newUN']
    
    response = {
        'valid': True,
        'message': 'Username updated!',
        'newUN': newUN
    }

    # Check if new username is valid (doesn't already exist in database)
    matchingUsername = User.objects.filter(username=newUN)
    
    # If username is already taken, do not update and send back an error message
    if len(matchingUsername) != 0:
        response['valid'] = False
        response['message'] = 'Error: this username is already taken!'
    
    # Also, if the username was blank, send back a different error message
    elif len(newUN) == 0:
        response['valid'] = False
        response['message'] = 'Error: please do not leave the username field blank.'

    # Test for username validity 
    elif not isValidUsernameOrPassword(newUN):
        response['valid'] = False
        response['message'] = 'Please enter a username containing between 3 and 30 alphanumeric characters.'
    
    # If you got a valid username, update it in the database
    else:
        currUser.username = newUN
        currUser.save()
    

    return JsonResponse(response)

############################################################################



############################################################################
# ADDING, VIEWING, UPDATING LIST ITEMS
# View to add new list item 
def additem(request):
    
    # Only allow authenticated users to add items
    if not request.user.is_authenticated:
        return redirect('/signup/')

    # GET requests do not make sense in this case
    if request.method != 'POST': 
        return redirect('/lists/')


    # Create new ListItem based on POST data
    newItem = ListItem()
    newItem.itemType = request.POST['itemType']
    newItem.title = request.POST['title']
    newItem.url = request.POST['url']
    newItem.notes = request.POST['notes']
    newItem.isProfileHidden = request.POST['isProfileHidden']
    newItem.user = request.user

    # Fill in current date as date added
    newItem.dateAdded = date.today()

    # Save new item in database
    newItem.save()
    print('new item visibility flag ' + str(newItem.isProfileHidden))

    # Create profile activity for this item's creation
    newProfileActivity = ProfileActivity()
    newProfileActivity.date = newItem.dateAdded
    newProfileActivity.activityType = 's'
    newProfileActivity.itemName = newItem.title
    newProfileActivity.itemType = newItem.itemType
    newProfileActivity.hidden = newItem.isProfileHidden
    newProfileActivity.listItem = newItem
    newProfileActivity.user = request.user

    newProfileActivity.save()

    # Send new item back to page to render
    response = '<div class="colItem" id="' + str(newItem.id) + '"><h3>' + newItem.title + '</h3></div>' 
    return HttpResponse(response)


# View to return HTML to render on the lists page based on details on a list item from the database 
def getitem(request, itemid): 

    # Only allow authenticated users to view items
    if not request.user.is_authenticated:
        return redirect('/signup/')

    # POST requests do not make sense in this case
    if request.method != 'GET': 
        return redirect('/lists/')

    # Find item matching ID from capture group
    foundItem = ListItem.objects.get(id=itemid, user=request.user)

    # Build display to respond with based on fields of found item
    resData = {
    'title': foundItem.title,
    'notes': foundItem.notes,
    'url': foundItem.url,
    'isProfileHidden': foundItem.isProfileHidden 
    }

    response = """
    <div>
        <h1 class="itemTitle">{title}</h1>
        <p class="itemNotes">{notes}</p>
        <a class="itemURL" href="{url}">{url}</a>
        <p id="profileVisibility" class="{isProfileHidden}"></p>
    </div>
    """.format(**resData)

    return HttpResponse(response)


# View to mark a list item as complete in the database/archive it
def markcomplete(request, itemid): 

    # Only allow authenticated users to update items
    if not request.user.is_authenticated:
        return redirect('/signup/')

    # POST requests do not make sense in this case
    if request.method != 'GET': 
        return redirect('/lists/')

    # Find item matching ID from capture group
    foundItem = ListItem.objects.get(id=itemid, user=request.user)

    # Update its archive status, set its date finished to the current day 
    foundItem.isArchived = True
    foundItem.dateFinished = date.today()

    foundItem.save()

    # Update the associated user's count of completed items
    # Get profile information matching this user
    profileInfo = UserProfileInfo.objects.get(user=request.user)

    profileInfo.itemsCompleted += 1
    profileInfo.save()

    # Create a completion profile activity for this item 
    newProfileActivity = ProfileActivity()
    newProfileActivity.date = foundItem.dateFinished
    newProfileActivity.activityType = 'f'
    newProfileActivity.itemName = foundItem.title
    newProfileActivity.itemType = foundItem.itemType
    newProfileActivity.hidden = foundItem.isProfileHidden
    newProfileActivity.listItem = foundItem
    newProfileActivity.user = request.user

    newProfileActivity.save()

    return HttpResponse("item archived")

# View to edit a list item
def edititem(request):

    # Only allow authenticated users to add items
    if not request.user.is_authenticated:
        return redirect('/signup/')

    # GET requests do not make sense in this case
    if request.method != 'POST':
        return redirect('/lists/')

    # Get edited item data from request's POST data 
    itemData = request.POST

    # Find and update item matching the ID in the request
    foundItem = ListItem.objects.get(id=itemData['id'], user=request.user)

    titleChanged = False
    if foundItem.title != itemData['title']:
        titleChanged = True

    foundItem.title = itemData['title']
    foundItem.url = itemData['url']
    foundItem.notes = itemData['notes']

    if itemData['isProfileHidden'] == 'True': 
        foundItem.isProfileHidden = True
    else:
        foundItem.isProfileHidden = False

    foundItem.save()

    # Update profile activity for this item if title has changed
    if titleChanged: 
        profileActivities = ProfileActivity.objects.filter(listItem=foundItem)
        print(profileActivities)
        for activity in profileActivities: 
            print(activity)
            activity.itemName = itemData['title']
            activity.save()

    return HttpResponse("edit item")

# View to find list items by a query string and return them as a JSON response
def findItemsByQuery(request):
    print(request)
    # Check if the user is authenticated
    if not request.user.is_authenticated:
        return redirect('/signup/')

    # Find list items matching given query
    # Item type
    foundItems = []
    if 'itemType' in request.POST:
        if 'isArchived' in request.POST:
            if request.POST['isArchived'] == 'True':
                foundItems = ListItem.objects.filter(itemType=request.POST['itemType'], user=request.user)
            else:
                foundItems = ListItem.objects.filter(itemType=request.POST['itemType'], user=request.user, isArchived=False)
    # Archive status
    elif 'isArchived' in request.POST:
        foundItems = ListItem.objects.filter(user=request.user, isArchived=request.POST['isArchived']); 
    # Serialize items as JSON
    data = serializers.serialize("json", foundItems)

    return HttpResponse(data)


# Delete a list item
def deleteitem(request, itemid):

    # Delete item at specified id
    foundItem = ListItem.objects.get(id=itemid)
    foundItem.delete()  

    return HttpResponse(str(itemid) + " deleted.")
############################################################################




############################################################################
# PROFILE, USER INFO/SETTINGS
# User profile
def profile(request, username):

    # Check if the user is authenticated
    if not request.user.is_authenticated:
        return redirect('/signup/')

    # Check if current authenticated user matches the one
    # requesting the profile
    currUser = request.user
    profileUser = User.objects.get(username=username)

    context = {}

    if currUser == profileUser and currUser.is_authenticated:
        context['auth'] = True
    else:
        context['auth'] = False

    context['username'] = username

    # Get profile information matching this user
    profileInfo = UserProfileInfo.objects.get(user=profileUser)
    
    context['itemsCompleted'] = profileInfo.itemsCompleted
    context['status'] = profileInfo.status

    # Populate context with list item info for that user, for use in status select boxes
    context['watchList'] = ListItem.objects.filter(user=currUser, itemType='w', isArchived=False)
    context['readList'] = ListItem.objects.filter(user=currUser, itemType='r', isArchived=False)
    context['listenList'] = ListItem.objects.filter(user=currUser, itemType='l', isArchived=False)
    context['playList'] = ListItem.objects.filter(user=currUser, itemType='p', isArchived=False)
    context['tryList'] = ListItem.objects.filter(user=currUser, itemType='t', isArchived=False)

    # Get profile activity for this user
    context['profileActivity'] = ProfileActivity.objects.filter(user=profileUser, hidden=False)
    # Sort by date
    context['profileActivity'] = mergeSort(0, len(context['profileActivity']), list(context['profileActivity']))
    
    return render(request, 'watchlist/profile.html', context=context)



# View to edit a user's profile information and settings
def edituserinfo(request):

    # Check that authenticated user matches user from request
    foundUser = User.objects.get(username=request.POST['username'])

    if not (foundUser.is_authenticated and request.user.is_authenticated and request.user == foundUser):
        return redirect('/signup/')

    # If authenticated, find the user's matching settings entry 
    userSettings = UserProfileInfo.objects.get(user=foundUser)

    # Update any fields specified in the POST request
    # Status
    if 'status' in request.POST:
        userSettings.status = request.POST['status']
    
    # Theme
    if 'theme' in request.POST:
        userSettings.colorTheme = request.POST['theme']
    userSettings.save()

    return HttpResponse("edited")


# View to get user's current preferences, return them as a JSON response
def getuserinfo(request):

    # Find user matching user in request body
    if 'username' in request.POST:
        foundUser = User.objects.get(username=request.POST['username'])
    else:
        foundUser = request.user

    # Redirect back to signup if requested user is not authenticated 
    if (not foundUser.is_authenticated) or foundUser != request.user:
        return redirect('/signup/')

    # Find settings information for that user
    userSettings = UserProfileInfo.objects.filter(user=foundUser)

    # Convert to JSON format and return response
    jsonRes = serializers.serialize("json", userSettings)

    return HttpResponse(jsonRes)
############################################################################


############################################################################
# ARCHIVE
def archive(request):
    return render(request, 'watchlist/archive.html', {'username': request.user.username})


############################################################################


############################################################################
# UTILITY FUNCTIONS 
def mergeSort(left, right, l): 

    if(abs(left-right) <= 1):
        return l[left:right]

    mid = (left + right) // 2
    
    leftList = mergeSort(left, mid, l)
    rightList = mergeSort(mid, right, l)

    currIdx = left
    leftIdx = 0 
    rightIdx = 0 

    while leftIdx < len(leftList) and rightIdx < len(rightList):

        if leftList[leftIdx].date >= rightList[rightIdx].date:
            l[currIdx] = leftList[leftIdx]
            leftIdx += 1
        else:
            l[currIdx] = rightList[rightIdx]
            rightIdx += 1

        currIdx += 1

    while leftIdx < len(leftList):
        l[currIdx] = leftList[leftIdx]
        leftIdx += 1
        currIdx += 1

    while rightIdx < len(rightList):
        l[currIdx] = rightList[rightIdx]
        rightIdx += 1
        currIdx += 1

    return l[left:right]
    


def isValidUsernameOrPassword(un, pw=False):
    if pw:
        regex = re.compile("^[a-z0-9_-]{10,30}$")
    else:
        regex = re.compile("^[a-z0-9_-]{3,30}$")
    return re.fullmatch(regex, un)