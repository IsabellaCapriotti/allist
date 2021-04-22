//***************************************************
// Status form
/* When the user changes the selection in the action section of the form,
update which options are available to them in the item section */
const actionSelect = document.getElementById("statusAction");
const itemSelect = document.getElementById("statusItem");

actionSelect.addEventListener( 'change', (e) => {
    // Get action type
    let actionType = e.target.value[0].toLowerCase();

    // Get outer select element to append to
    let select = document.getElementById('statusItem');

    // Clear all previous options
    let origLength = select.children.length;

    for(let i=0; i < origLength; i++){
        select.removeChild(select.children[0]);
    }

    // Send HTTP request to /findbyquery/ page to return a list of all the items matching this item type
    let xhttp = new XMLHttpRequest();
    let csrfToken = getCookie('csrftoken');
    let destination = window.location.origin + '/findbyquery/';

    xhttp.open('POST', destination);

    xhttp.setRequestHeader('X-CSRFToken', csrfToken);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttp.send(`itemType=${actionType}&isArchived=False`);

    // Parse response data for each returned list item and add an option to the select menu
    xhttp.addEventListener('readystatechange', function(){

        if(this.readyState == 4 && this.status == 200){

            // Parse data
            let responseData = JSON.parse(this.responseText);

            for(let i=0; i < responseData.length; i++){
                // Add new option
                let newOption = document.createElement('option');
                newOption.value = responseData[i]['fields']['title'];
                newOption.innerText = responseData[i]['fields']['title'];

                select.appendChild(newOption);
            }
        }
    });

});

/* Send request to edit user info when submit button is pressed */
const changeStatusBtn = document.getElementById("changeStatusBtn");

changeStatusBtn.addEventListener( 'click', (e) => {

    e.preventDefault();

    // Get new status and associated username
    let actionInput = document.getElementById('statusAction').value;
    let itemInput = document.getElementById('statusItem').value;
    let newStatus = actionInput + ' ' + itemInput;
    let username = document.querySelector(".username").innerText;

    // Build request to /edituserinfo/ page
    let xhttp = new XMLHttpRequest();
    let csrf_token = getCookie('csrftoken');
    let destination = window.location.origin + '/edituserinfo/';

    xhttp.open('POST', destination);
    xhttp.setRequestHeader('X-CSRFToken', csrf_token);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhttp.send(`status=${newStatus}&username=${username}`);
});


// ***************************************************************
// Utility function to get CSRF token cookie
function getCookie(name){

    let cookieVal = null;

    if(document.cookie && document.cookie != ''){
        const cookies = document.cookie.split(';');

        for(let i=0; i < cookies.length; i++){
            const currCookie = cookies[i].trim();
            if(currCookie.substring(0, name.length + 1) === (name + '=') ){
                cookieVal = decodeURIComponent(currCookie.substring(name.length+1));
                break;
            }
        }
    }

    return cookieVal;
}

// ***************************************************************
// Logging out
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener( 'click', (e) => {

    let xhttp = new XMLHttpRequest();
    let destination = window.location.origin + '/logout/';

    xhttp.open('GET', destination);
    xhttp.send();

    let signInPage = window.location.origin + '/signin/';
    window.location = signInPage;
});

//***************************************************
// Home button (redirects back to list page)
const homeBtn = document.querySelector('.homeBtn');
homeBtn.addEventListener( 'click', (e) => {

    let destination = window.location.origin + '/lists/';
    window.location = destination;

});

//***************************************************
// Settings
const settingsBtn = document.querySelector('.settingsBtn');
const settingsBar = document.querySelector(".settingsBar");

// Show side bar for settings when settings button clicked
settingsBtn.addEventListener('click', () => {

    settingsBar.classList.toggle('hidden');

    window.setTimeout( () => {
        settingsBar.style.transform = 'translateX(0px)';
    }, 50);

});

// Hide side bar for settings when settings button clicked
const closeSettingsBarBtn = document.querySelector('.closeSettingsBarBtn');

closeSettingsBarBtn.addEventListener('click', () => {

    settingsBar.style.transform = 'translateX(700px)';

    window.setTimeout( () => {
        settingsBar.classList.toggle('hidden');
    }, 500);

});

// Settings bar options

//***************************************************
// Change theme
const changeThemeBtn = document.getElementById("changeThemeBtn");
const overlay = document.querySelector(".screenOverlay");

// Show Theme Select overlay when change theme button is clicked
changeThemeBtn.addEventListener( 'click', (e) => {
    overlay.classList.toggle("hidden");
});

// Hide the overlay when you click outside the select window
overlay.addEventListener( 'click', (e) =>{
    if(e.target.classList.contains("screenOverlay")){
        e.target.classList.toggle("hidden");
    }
});

// Update theme setting when selection is clicked
const themeOptions = document.querySelectorAll(".themeBox");

for(let i=0; i < themeOptions.length; i++){

    themeOptions[i].addEventListener( 'click', (e) => {

        // Get theme choice
        let themeChoice = e.target.id[0];

        // Build POST request
        let xhttp = new XMLHttpRequest();
        let destination = window.location.origin + '/edituserinfo/';
        let csrf_token = getCookie('csrftoken');

        xhttp.open('POST', destination);
        xhttp.setRequestHeader('X-CSRFToken', csrf_token);
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        // Populate request body with data to update
        let username = document.querySelector(".username").innerText;

        xhttp.send(`username=${username}&theme=${themeChoice}`);

        xhttp.addEventListener( 'readystatechange', function(){

            if(this.status == 200 && this.readyState == 4){
                console.log(this.responseText);
                loadProfile();
            }
        });

    });
}

//***************************************************
// Load profile with correct theme
function loadProfile(){

    // Get user's current theme through the /getuserinfo/ endpoint
    let username = document.querySelector(".username").innerText;

    // Build POST request
    let xhttp = new XMLHttpRequest();
    let destination = window.location.origin + '/getuserinfo/';
    let csrf_token = getCookie('csrftoken');

    xhttp.open('POST', destination);
    xhttp.setRequestHeader('X-CSRFToken', csrf_token);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhttp.send(`username=${username}`);

    xhttp.addEventListener( 'readystatechange', function(){

        // Once you receive the response, update the profile's theme accordingly
        if(this.readyState == 4 && this.status == 200){

            let res = JSON.parse(this.responseText);
            let theme = res[0]['fields']['colorTheme'];

            // Elements to style
            const pageContainer = document.querySelector(".pageContainer");
            const username = document.querySelector(".username");
            const navBtns = document.querySelectorAll(".navBtn");
            const selects = document.querySelectorAll(".changeStatusForm select");
            const submitBtn = document.querySelector(".submitBtn");
            const settingsBar = document.querySelector(".settingsBar");
            const settingsBarBtns = document.querySelectorAll(".settingsBarBtn");
            const themeSelectWindow = document.querySelector(".themeSelectWindow");
            const activityHeader = document.querySelector(".activityHeader"); 

            // Clear previous styles
            pageContainer.classList.remove('orangeThemeBg', 'greenThemeBg', 'purpleThemeBg', 'blueThemeBg');
            username.classList.remove('orangeThemeMainText', 'greenThemeMainText', 'purpleThemeMainText', 'blueThemeMainText');

            for(let i=0; i < navBtns.length; i++){
                navBtns[i].classList.remove('orangeThemeMainText', 'greenThemeMainText', 'purpleThemeMainText', 'blueThemeMainText');
                navBtns[i].classList.remove('orangeThemeHover', 'greenThemeHover', 'purpleThemeHover', 'blueThemeHover');
            }

            for(let i=0; i < selects.length; i++){
                selects[i].classList.remove('orangeThemeAccentBorder', 'greenThemeAccentBorder', 'purpleThemeAccentBorder', 'blueThemeAccentBorder');
            }

            for(let i=0; i < settingsBarBtns.length; i++){
                settingsBarBtns[i].classList.remove('orangeThemeHover', 'greenThemeHover', 'purpleThemeHover', 'blueThemeHover');
            }

            submitBtn.classList.remove('orangeThemeMainText', 'greenThemeMainText', 'purpleThemeMainText', 'blueThemeMainText');
            submitBtn.classList.remove('orangeThemeHover', 'greenThemeHover', 'purpleThemeHover', 'blueThemeHover');

            settingsBar.classList.remove('orangeThemeMainBorder', 'greenThemeMainBorder', 'purpleThemeMainBorder', 'blueThemeMainBorder');
            themeSelectWindow.classList.remove('orangeThemeBg', 'greenThemeBg', 'purpleThemeBg', 'blueThemeBg');

            activityHeader.classList.remove('orangeThemeAccentText', 'greenThemeAccentText', 'purpleThemeAccentText', 'blueThemeAccentText'); 

            // Determine base theme name (used to access all the class names)
            let themeName = '';

            switch(theme){
                case 'o':
                    themeName = 'orangeTheme';
                    break;
                case 'g':
                    themeName = 'greenTheme';
                    break;
                case 'p':
                    themeName = 'purpleTheme';
                    break;
                case 'b':
                    themeName = 'blueTheme';
                    break;
            }

            // Update elements
            pageContainer.classList.add(`${themeName}Bg`);
            username.classList.add(`${themeName}MainText`);

            for(let i=0; i < navBtns.length; i++){
                navBtns[i].classList.add(`${themeName}MainText`);
                navBtns[i].classList.add(`${themeName}Hover`);
            }

            for(let i=0; i < selects.length; i++){
                selects[i].classList.add(`${themeName}AccentBorder`);
            }

            for(let i=0; i < settingsBarBtns.length; i++){
                settingsBarBtns[i].classList.add(`${themeName}Hover`);
            }

            submitBtn.classList.add(`${themeName}MainText`);
            submitBtn.classList.add(`${themeName}Hover`);

            settingsBar.classList.add(`${themeName}MainBorder`);
            themeSelectWindow.classList.add(`${themeName}Bg`);

            activityHeader.classList.add(`${themeName}AccentText`); 
        }
    });

}

loadProfile();

//***************************************************
// Change username
const changeUsernameBtn = document.getElementById('changeUsernameBtn'); 

changeUsernameBtn.addEventListener('click', (e) => {

    // Show popup window for new username
    

    // Send request to change username endpoint
    let xhttp = new XMLHttpRequest(); 
    let destination = window.location.origin + '/changeun/'; 
    xhttp.open('GET', destination); 
    xhttp.send()

    xhttp.addEventListener('readystatechange', function(){
        
        if(this.readyState == 4 && this.status == 200){
            console.log(this.responseText); 
        }
    }); 
}); 