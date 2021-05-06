// ***************************************************************
// Add event listeners for all add item buttons 
let addButtons = document.querySelectorAll(".addBtn");


for(i=0; i < addButtons.length; i++){
    
    addButtons[i].addEventListener( 'mouseover', (e) => {
        e.target.style.transform = 'rotate(90deg)'; 
    }); 

    addButtons[i].addEventListener( 'mouseout', (e) => {
        e.target.style.transform = 'rotate(-90deg)'; 
    }); 

    addButtons[i].addEventListener( 'click', (e) => {

        // Hide all other pop-up windows
        let allPopups = document.querySelectorAll(".coverPage"); 
        for(let i=0; i < allPopups.length; i++){
            if(!allPopups[i].classList.contains("hidden")){
                allPopups[i].classList.add("hidden"); 
            }
        }
   
        // Clear out previous error messages
        const formContainer = document.querySelector(".addItem"); 
        prevErrors = formContainer.querySelectorAll(".errorMessage");
        
        for(let i=0; i < prevErrors.length; i++){
            formContainer.removeChild(prevErrors[i]); 
        }

        // Clear checkbox
        const isProfileHiddenSelect = document.getElementById("id_isProfileHidden"); 
        isProfileHiddenSelect.checked = false; 

        // Get parent column
        let colName = getParentColumnName(e.target); 

        // Show pop-up window
        let addItemWindow = document.querySelector(".addItemCover");
        addItemWindow.classList.remove("hidden"); 
        let addItemHeader = addItemWindow.querySelector(".addItemHeader"); 
        
        // Generate header text for pop-up 
        if(colName != 'listen'){
            addItemHeader.innerText = "I want to " + colName + "..."; 
        }
        else{
            addItemHeader.innerText = "I want to " + colName + " to..."; 
        }
    });
}

// ***************************************************************
// Form submit button
let submitBtn = document.querySelector(".submitBtn"); 

submitBtn.addEventListener('click', (e) => {
    
    e.preventDefault(); 

    // Check form validity
    let isValid = document.querySelector(".addItemForm").checkValidity(); 
    if(!isValid){

        // Create error message reporting invalid field
        let formContainer = document.querySelector(".addItem"); 
        let newP = document.createElement('p'); 
        newP.classList.add("errorMessage"); 

        let titleInput = document.querySelector("#id_title"); 
        let urlInput = document.querySelector("#id_url"); 

        if(!titleInput.checkValidity()){
            newP.innerText = "Please don't leave the title field blank!"; 
        }
        else if(!urlInput.checkValidity()){
            newP.innerText = "Please enter a valid URL in the URL field.";
        }
        

        // Add new error message
        formContainer.appendChild(newP); 

        return; 
    }

    // Build request to add item page
    let xhttp = new XMLHttpRequest(); 
    
    // Get CSRF token 
    const csrf_token = getCookie('csrftoken'); 

    // Get form data
    // Get name of current item type from header on the form 
    const addItemContainer = document.querySelector(".addItem"); 
    const addItemHeader = addItemContainer.querySelector(".addItemHeader").innerText; 
    let itemType = addItemHeader.substr(addItemHeader.search("to")+2).trim(); 
    const ellipsisPos = itemType.indexOf("\."); 
    const spacePos = itemType.indexOf(" ");

    if(spacePos > 0 && spacePos < ellipsisPos){
        itemType = itemType.substr(0, spacePos).trim()[0]; 
    }
    else{
        itemType = itemType.substr(0, ellipsisPos).trim()[0];
    }


    //const title = sanitize(document.querySelector("#id_title").value);
    const title = encodeURI(sanitize(document.querySelector("#id_title").value)); 
    const url = encodeURI(document.querySelector("#id_url").value, true); 
    const notes = encodeURI(document.querySelector("#id_notes").value); 
    const isProfileHidden = document.querySelector("#id_isProfileHidden"); 
    let isProfileHiddenVal = "False"; 
    if(isProfileHidden.checked){
        isProfileHiddenVal = "True"; 
    }

    // Send POST request to /additem/ page
    let destination = window.location.origin + '/additem/';

    xhttp.open('POST', destination, true);     
    xhttp.setRequestHeader('X-CSRFToken', csrf_token); 
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    let req = `itemType=${itemType}&title=${title}&notes=${notes}&url=${url}&isProfileHidden=${isProfileHiddenVal}`; 
    xhttp.send(req); 

    // Get response and render it on the page as a new list item

    let response = ''; 

    xhttp.onreadystatechange = function(){

        if(this.readyState == 4 && this.status == 200){
            response = this.responseText;

        // Get current column 
        let containerColumn = document.getElementById(itemType);

        // Insert new element directly before add button
        let addBtn = containerColumn.querySelector(".addBtn"); 
        addBtn.insertAdjacentHTML('beforebegin', response); 
        
        // Add click event listener to new item
        let newItem = addBtn.previousSibling; 
        newItem.addEventListener( 'click', viewItem)
        }
    }


    // Close out form entry window
    let popUpWindow = document.querySelector(".coverPage"); 
    popUpWindow.classList.add("hidden"); 

    // Clear form
    document.querySelector("#id_title").value = '';
    document.querySelector("#id_url").value = ''; 
    document.querySelector("#id_notes").value = ''; 

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

// Utility function to sanitize user input
function sanitize(string, url=false) {

    let map = {
        '&': 'amp;',
        '<': 'lt;',
        '>': 'gt;',
        '"': 'quot;',
        "'": '#x27;',
        "/": '#x2F;',
    };
    let reg = /[&<>"'/]/ig;


    return string.replace(reg, (match)=>(map[match]));
}

function decode(string){
    map = {
        'amp;': '&',
        'quot;':'"' ,
        '#x27;': "'",
        '#x2F;': "/",
    };
    reg = /(amp;|quot;|#x27;|#x2F;)/ig;

    return string.replace(reg, (match) => (map[match])); 
}

// Utility function to get parent column name
function getParentColumnName(element){

    let currParentNode = element.parentNode; 

    while(!currParentNode.classList.contains("centeredCol")){

        try{
        currParentNode = currParentNode.parentNode; 
        }
        catch(e){
            break;
        }
    }

    let colName = currParentNode.classList[0]; 
    colName= colName.substr(0, colName.indexOf("Col")); 

    return colName; 
}

// ***************************************************************
// Event listener to exit out of add item form when the background is clicked
let popUpWindow = document.querySelectorAll(".coverPage");

for(let i=0; i < popUpWindow.length; i++){
    popUpWindow[i].addEventListener('click', (e) => {

        // Hide the pop up only if the actual background is clicked
        if(e.target.classList[0] != 'coverPage'){
            return; 
        }
        else{
            e.target.classList.add("hidden"); 
        }
    
    }); 
}

// ***************************************************************
// Event listener callback function for every list item. Opens up a page where the
// user can view the details of that item 
function viewItem(e){

    // Hide all other pop-up windows
    let allPopups = document.querySelectorAll(".coverPage"); 
    for(let i=0; i < allPopups.length; i++){
        if(!allPopups[i].classList.contains("hidden")){
            allPopups[i].classList.add("hidden"); 
        }
    }

    // Show pop-up window with correct header
    let viewItemWindow = document.querySelector(".viewItemCover"); 
    viewItemWindow.classList.remove("hidden"); 
    let viewItemHeader = viewItemWindow.querySelector(".viewItemHeader"); 

    // Get parent column
    let colName = getParentColumnName(e.target); 


    // Generate header text for pop-up 
    if(colName != 'listen'){
        viewItemHeader.innerText = "I want to " + colName + "..."; 
    }
    else{
        viewItemHeader.innerText = "I want to " + colName + " to..."; 
    }

    // Clear any items that have previously been inserted
    let outerContainer = viewItemWindow.querySelector(".viewItem"); 
    let prevItems = outerContainer.querySelectorAll(".listItemInfoContainer"); 

    for(let i=0; i < prevItems.length; i++){
        outerContainer.removeChild(prevItems[i]); 
    }

    // Send GET request to the /getitem/ page in order to receive item information from the database
    let xhttp = new XMLHttpRequest()
    let itemID = e.target.parentNode.id; 
    let destination = window.location.origin + '/getitem/' + itemID + '/';

    xhttp.open('GET', destination); 
    xhttp.send(); 
    
    xhttp.addEventListener('readystatechange', function(){
        if(this.readyState == 4 && this.status == 200){
            let response = this.responseText;

            // Once response has been received, render it in the view item container
            let outerContainer = viewItemWindow.querySelector(".viewItem"); 
            let infoContainer = document.createElement("div"); 
            let editBtn = document.querySelector(".editItemBtn"); 
            editBtn.id = itemID + "edit"; 
            infoContainer.classList.add("listItemInfoContainer"); 
            infoContainer.id = itemID + "info"; 
            infoContainer.insertAdjacentHTML('afterbegin', response);
            outerContainer.appendChild(infoContainer);  
        }
        
    }); 

}

// Add event listener to all list items present on initial load
let listItems = document.querySelectorAll(".colItem"); 

for(let i=0; i < listItems.length; i++){
    listItems[i].addEventListener('click', viewItem); 
}

// ***************************************************************
// Event listener for button to mark item as complete/archive it
let markCompleteBtn = document.querySelector(".markCompleteBtn"); 

markCompleteBtn.addEventListener( 'click', (e) =>{

    // Get ID of item from info container
    let itemID = document.querySelector(".listItemInfoContainer").id;
    itemID = itemID.substr(0, itemID.indexOf("info"));  

    // Send GET request to page to update item 
    let xhttp = new XMLHttpRequest(); 
    let destination = window.location.origin + '/markcomplete/' + itemID; 

    xhttp.open('GET', destination); 
    xhttp.send(); 

    xhttp.addEventListener('readystatechange', function (){
        
        // Once item has been archived, remove it from the list onscreen and clear all popups
        if(this.readyState == 4 && this.status == 200){
            
            let removedItemEntry = document.getElementById(itemID); 
            removedItemEntry.parentNode.removeChild(removedItemEntry); 

            let allPopups = document.querySelectorAll(".coverPage"); 
            for(let i=0; i < allPopups.length; i++){
                if(!allPopups[i].classList.contains("hidden")){
                    allPopups[i].classList.add("hidden"); 
                }
            }
        }
    }); 

}); 

// ***************************************************************
// Event listener for button to update item
let editBtn = document.querySelector('.editItemBtn'); 

editBtn.addEventListener( 'click', (e) => {

    // Hide all other pop-up windows
    let allPopups = document.querySelectorAll(".coverPage"); 
    for(let i=0; i < allPopups.length; i++){
        if(!allPopups[i].classList.contains("hidden")){
            allPopups[i].classList.add("hidden"); 
        }
    }

    // Get ID of item to edit and parent info container
    let itemID = 0;
    let parentContainer = document.querySelector('.viewItemCover'); 
    let itemInfo = parentContainer.querySelector('.listItemInfoContainer'); 

    if(e.target.classList[0] != "editItemBtn"){
        itemID = e.target.parentNode.id;
    }
    else{
        itemID = e.target.id; 
    }

    itemID = itemID.substr(0, itemID.indexOf('edit')); 

    // Get parent column name to show in popup
    let header = document.querySelector(".editItemHeader"); 
    let entryItem = document.getElementById(itemID); 
    let colName = getParentColumnName(entryItem); 
    
    if(colName == "listen"){
        header.innerText = "I want to " + colName + " to..."; 
    }
    else{
        header.innerText = "I want to " + colName + "..."; 
    }

    // Show popup 
    let editItemWindow = document.querySelector(".editItemCover"); 
    editItemWindow.classList.remove("hidden"); 
    
   
    // Fill in form info with current item information
    let titleInput = document.getElementById("edit_title"); 
    let urlInput = document.getElementById("edit_url"); 
    let notesInput = document.getElementById("edit_notes");   
    let isProfileHidden = document.getElementById("edit_isProfileHidden"); 
 
    titleInput.value = itemInfo.querySelector(".itemTitle").innerText; 
    urlInput.value = itemInfo.querySelector(".itemURL").innerText; 
    notesInput.value = itemInfo.querySelector(".itemNotes").innerText; 

    let visibilityValue = document.getElementById("profileVisibility").classList[0]; 

    if(visibilityValue == "True"){
        isProfileHidden.checked = true; 
    }
    else{
        isProfileHidden.checked = false; 
    }

    // Submit form 
    let submitBtn = document.querySelector(".editSubmitBtn"); 

    submitBtn.addEventListener('click', (e) => {

        e.preventDefault(); 

        // Create POST request
        let xhttp = new XMLHttpRequest()
        let destination = window.location.origin + '/edititem/'; 

        xhttp.open('POST', destination); 

        // Get CSRF token 
        const csrf_token = getCookie('csrftoken'); 
        xhttp.setRequestHeader('X-CSRFToken', csrf_token); 
        xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

        // Get form data to send with request
        let title = encodeURI(sanitize(titleInput.value)); 
        let url = encodeURI(sanitize(urlInput.value, true)); 
        let notes = encodeURI(sanitize(notesInput.value));
        let id = itemID; 
        if(isProfileHidden.checked){
            visibilityValue = "True"; 
        }
        else{
            visibilityValue = "False"; 
        }

        xhttp.send(`title=${title}&url=${url}&notes=${notes}&id=${id}&isProfileHidden=${visibilityValue}`); 

        // Once you get a valid response, update the title of the entry on the page
        xhttp.addEventListener("readystatechange", function(){
            
            if(this.readyState == 4 && this.status == 200){
                // Get matching column item, change text
                const columnItem = document.getElementById(itemID); 
                const header = columnItem.querySelector("h3"); 
                header.innerText = decode(titleInput.value); 
            }
        });

    }); 

});

// ***************************************************************
// Event listener for button to delete item
const deleteItemBtn = document.querySelector(".deleteItemBtn"); 

deleteItemBtn.addEventListener( "click", (e) => {

    // Get ID of list item to delete
    let itemID = 0; 
    let infoContainer = document.querySelector(".listItemInfoContainer"); 
    itemID = infoContainer.id.substr(0, infoContainer.id.indexOf("info")); 
    
    // Send request to delete
    let xhttp = new XMLHttpRequest(); 
    let destination = window.location.origin + '/deleteitem/' + itemID; 
    xhttp.open('GET', destination); 
    xhttp.send(); 

    xhttp.addEventListener("readystatechange", function(){
        if(this.readyState == 4 && this.status == 200){
            // After deletion, remove list item from page
            const listItem = document.getElementById(itemID); 
            listItem.remove(); 

            // Close edit window
            let allPopups = document.querySelectorAll(".coverPage"); 
            for(let i=0; i < allPopups.length; i++){
                if(!allPopups[i].classList.contains("hidden")){
                    allPopups[i].classList.add("hidden"); 
                }
            }
        }
    }); 

});

// ***************************************************************
// Button to access user profile 

// Switch to other icon on hover
let profileIcon = document.querySelector('.profileIcon'); 

profileIcon.addEventListener( 'mouseover', (e) => {
    e.target.innerText = 'sentiment_very_satisfied'; 
});

profileIcon.addEventListener( 'mouseout', (e) => {
    e.target.innerText = 'sentiment_satisfied'; 
}); 

// Send to profile on click
profileIcon.addEventListener( 'click', (e) => {

    let username = document.querySelector(".profileBtn").id; 
    let destination = window.location.origin + '/profile/' + username + '/'; 

    window.location.href = destination; 
}); 

// ***************************************************************
// Reposition profile visibility select next to label
const addVisibilitySelect = document.getElementById("id_isProfileHidden"); 
const addVisibilitySelectLabel = document.querySelector("label[for='id_isProfileHidden']");
const editVisibilitySelect = document.getElementById("edit_isProfileHidden"); 
const editVisibilitySelectLabel = document.querySelector("label[for='edit_isProfileHidden']"); 

const addSelectWindow = document.createElement("div"); 
addSelectWindow.classList.add("hiddenSelect"); 
addSelectWindow.appendChild(addVisibilitySelectLabel); 
addSelectWindow.appendChild(addVisibilitySelect); 

const addItemForm = document.querySelector(".addItemForm"); 
addItemForm.appendChild(addSelectWindow); 

const editSelectWindow = document.createElement("div"); 
editSelectWindow.classList.add("hiddenSelect"); 
editSelectWindow.appendChild(editVisibilitySelectLabel); 
editSelectWindow.appendChild(editVisibilitySelect); 

const editItemForm = document.querySelector(".editItemForm"); 
editItemForm.appendChild(editSelectWindow); 

// ***************************************************************
// Load based on color theme
// Get theme for current user from /getuserinfo/ endpoint
let xhttp = new XMLHttpRequest(); 
let destination = window.location.origin + '/getuserinfo/'; 
let csrf_token = getCookie('csrftoken'); 

xhttp.open('POST', destination); 
xhttp.setRequestHeader('X-CSRFToken', csrf_token); 
xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

xhttp.send(); 

xhttp.addEventListener( 'readystatechange', function(){

    // Once response is received, use it to update theme
    if(this.readyState == 4 && this.status == 200){
        
        let res = JSON.parse(this.responseText); 
        let colorTheme = res[0]['fields']['colorTheme']; 

        let themeName = ''; 
        // Set base theme name for style classes
        switch(colorTheme){
            case 'o':
                themeName = 'orangeTheme'; 
                break;
            case 'p':
                themeName = 'purpleTheme'; 
                break;
            case 'g': 
                themeName = 'greenTheme'; 
                break;
            case 'b':
                themeName = 'blueTheme'; 
                break;
        }

        // Get elements to style
        const watchCol = document.querySelector(".watchCol"); 
        const readCol = document.querySelector(".readCol"); 
        const tryCol = document.querySelector(".tryCol"); 
        const listenCol = document.querySelector(".listenCol"); 
        const playCol = document.querySelector(".playCol"); 

        const addBtns = document.querySelectorAll(".addBtn"); 
        const itemWindows = document.querySelectorAll(".itemWindow"); 
        const itemHeaders = document.querySelectorAll(".itemHeader"); 
        const submitBtns = document.querySelectorAll(".submitBtn"); 

        const markCompleteBtns = document.querySelectorAll(".markCompleteBtn"); 
        const editBtns = document.querySelectorAll(".editItemBtn"); 
        const profileBtn = document.querySelector(".profileBtn"); 
        const deleteBtns = document.querySelectorAll(".deleteItemBtn"); 


        // Apply styles based on theme
        watchCol.classList.add(`${themeName}Col1`); 
        readCol.classList.add(`${themeName}Col2`);
        tryCol.classList.add(`${themeName}Col3`); 
        playCol.classList.add(`${themeName}Col4`); 
        listenCol.classList.add(`${themeName}Col5`); 

        for(let i=0; i < addBtns.length; i++){
            addBtns[i].classList.add(`${themeName}AccentText`); 
        }
        for(let i=0; i < itemWindows.length; i++){
            itemWindows[i].classList.add(`${themeName}BG`); 
        }
        for(let i=0; i < itemHeaders.length; i++){
            itemHeaders[i].classList.add(`${themeName}MainText`); 
        }
        for(let i=0; i < submitBtns.length; i++){
            submitBtns[i].classList.add(`${themeName}MainText`); 
            submitBtns[i].classList.add(`${themeName}AccentHover`); 
        }

        for(let i=0; i < markCompleteBtns.length; i++){
            markCompleteBtns[i].classList.add(`${themeName}AccentHover`); 
        }
        for(let i=0; i < editBtns.length; i++){
            editBtns[i].classList.add(`${themeName}AccentHover`); 
        }
        for(let i=0; i < deleteBtns.length; i++){
            deleteBtns[i].classList.add(`${themeName}AccentHover`); 
        }
        profileBtn.classList.add(`${themeName}AccentText`); 

        
    }
}); 
