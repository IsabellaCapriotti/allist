// ################################################################################
// Display proper theme colors on first load

// Get theme info 
let themeName; 
let data; 
let loadDone = false; 

window.addEventListener('load', () => {

    let xhttp = new XMLHttpRequest(); 
    let destination = window.location.origin + '/getuserinfo/'; 
    xhttp.open('GET', destination); 
    xhttp.send(); 

    xhttp.addEventListener('readystatechange', function(){

        if(this.readyState == 4 && this.status == 200){
            
            // Determine current theme from response
            let res = JSON.parse(this.responseText); 
            let colorTheme = res[0]['fields']['colorTheme']; 
            
            switch(colorTheme){
                case 'p':
                    themeName = 'purple'; 
                    break;
                case 'b':
                    themeName = 'blue'; 
                    break;
                case 'g':
                    themeName = 'green'; 
                    break;
                case 'o':
                    themeName = 'orange';
                    break;
            }
            
            themeName += 'Theme'; 

            // Get elements to style
            const container = document.querySelector(".pageContainer"); 
            const headerLetters = document.querySelectorAll(".headerLetter"); 

            // Add theme styles
            container.classList.add(`${themeName}Bg`); 

            for(let i=0; i < headerLetters.length; i++){
                headerLetters[i].classList.add(`${themeName}MainText`); 
            }
        }
    }); 

    // Get all archived items to render through find by query endpoint
    xhttp = new XMLHttpRequest(); 
    destination = window.location.origin + '/findbyquery/'; 
    xhttp.open('POST', destination); 

    let csrf_token = getCookie('csrftoken'); 
    xhttp.setRequestHeader('X-CSRFToken', csrf_token);
    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhttp.send('isArchived=True'); 

    // Once you receive all archived items, parse them and store them in the data array 
    xhttp.addEventListener('readystatechange', function(){
        if(this.status == 200 && this.readyState == 4){
            data = JSON.parse(this.responseText); 

            // Sort by date (oldest to newest by default)
            data = mergeSort(0, data.length, data); 

            // Once theme is determined, load the timeline
            loadDone = true;  

            drawTimeLine(); 
        }
    }); 

 
}); 

// ################################################################################


// ################################################################################
/* LOAD TIMELINE */ 

function drawTimeLine(){
    if(!loadDone){
        return; 
    }


    // Color counter
    let colorCounter = 1; 

    // Current ID 
    let currID; 

    // Maybe split into/label by months? 
    let timeline = document.querySelector(".timeline"); 

    // Draw portion of the line for every archived item 
    for(let i=0; i < data.length; i++){
    
        // Create segment 
        currID = data[i]['pk']; 
        let newSeg = document.createElement("div"); 
        newSeg.id = currID; 
        newSeg.style.height = 120; 
        newSeg.style.width = "15vw"; 
        newSeg.classList.add("segment"); 

        // Give correct color
        newSeg.classList.add(`${themeName}Col${colorCounter}`);
        colorCounter = (colorCounter % 5) + 1;

        timeline.appendChild(newSeg); 

        // Information for tooltip
        let startDate = data[i]['fields']['dateAdded'];
        let finDate = data[i]['fields']['dateFinished']; 
        let title = data[i]['fields']['title']
        let notes = data[i]['fields']['notes']
        let url = data[i]['fields']['url'] 

        // Create + style tooltip 
        let tooltip = document.createElement("div"); 
        tooltip.classList.add("tooltip"); 
        tooltip.classList.add("hidden"); 
        tooltip.id = currID + "tooltip"; 
        tooltip.classList.add(`${themeName}AccentBorder`); 

        // Add information to tooltip

        // Title
        let titleHeader = document.createElement("h3"); 
        titleHeader.innerText = title;
        tooltip.appendChild(titleHeader); 

        // Start/End date
        let startContainer = document.createElement("div"); 
        let startHeader = document.createElement("span");
        let startText = document.createElement("span");  
        startHeader.innerText = "Started on: "; 
        startHeader.classList.add("tooltipBold"); 
        startContainer.appendChild(startHeader); 
        startText.innerText = startDate; 
        startText.classList.add("tooltipRegular"); 
        startContainer.appendChild(startText); 
        tooltip.appendChild(startContainer); 
        
        let endContainer = document.createElement("div"); 
        let endHeader = document.createElement("span");
        let endText = document.createElement("span");  
        endHeader.innerText = "Finished on: "; 
        endHeader.classList.add("tooltipBold"); 
        endContainer.appendChild(endHeader); 
        endText.innerText = finDate; 
        endText.classList.add("tooltipRegular"); 
        endContainer.appendChild(endText); 
        tooltip.appendChild(endContainer); 


        // Notes, URL

        if(url){
            let urlContainer = document.createElement("div"); 
            let urlHeader = document.createElement("span"); 
            let urlText = document.createElement("span");  
            urlHeader.innerText = "URL: "; 
            urlHeader.classList.add("tooltipBold"); 
            urlContainer.appendChild(urlHeader); 
            urlText.innerText = url; 
            urlText.classList.add("tooltipRegular"); 
            urlContainer.appendChild(urlText); 
            tooltip.appendChild(urlContainer); 
        }

        if(notes){
            let notesContainer = document.createElement("div"); 
            let notesHeader = document.createElement("span"); 
            let notesText = document.createElement("span");  
            notesHeader.innerText = "Notes: "; 
            notesHeader.classList.add("tooltipBold"); 
            notesContainer.appendChild(notesHeader); 
            notesText.innerText = notes; 
            notesText.classList.add("tooltipRegular"); 
            notesContainer.appendChild(notesText); 
            tooltip.appendChild(notesContainer); 
        }

        // Done! Add the tooltip
        newSeg.appendChild(tooltip); 
        

        // Show tooltip on hover
        newSeg.addEventListener( "mouseover", (e) => {

            let foundTooltip; 

            if(e.target.classList.contains("tooltip")){
                foundTooltip = e.target; 
            }
            else{
                let segID = e.target.id; 
                foundTooltip = document.getElementById(segID + "tooltip"); 
            }
            
            if(foundTooltip && foundTooltip.classList.contains("hidden")){

                let vpWidth = window.innerWidth; 
                let vp15Per = vpWidth * .15; 

                foundTooltip.classList.remove("hidden"); 

                // Position tooltip 
                tooltip.style.top = newSeg.getBoundingClientRect()['y'] - window.pageYOffset; 
                tooltip.style.left = newSeg.getBoundingClientRect()['x'] + vp15Per + 10; //70; 
            }

        }); 

        // Hide tooltip on mouseout
        newSeg.addEventListener( "mouseout", (e) => {
            let foundTooltip; 

            if(e.target.classList.contains("tooltip")){
                foundTooltip = e.target; 
            }
            else{
                let segID = e.target.id; 
                foundTooltip = document.getElementById(segID + "tooltip"); 
            }

            if(foundTooltip && !foundTooltip.classList.contains("hidden")){
                foundTooltip.classList.add("hidden"); 
            }
        })

    }
}

// ################################################################################


// ################################################################################
// UTILITY FUNCTIONS 

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

function mergeSort(left, right, l){

    if(Math.abs(left-right) <= 1){
        return l.slice(left, right); 
    }

    let mid = Math.floor((left + right) / 2)
    
    let leftList = mergeSort(left, mid, l)
    let rightList = mergeSort(mid, right, l)

    let currIdx = left
    let leftIdx = 0 
    let rightIdx = 0 

    while (leftIdx < leftList.length && rightIdx < rightList.length){

        if(leftList[leftIdx]['fields']['dateFinished'] <= rightList[rightIdx]['fields']['dateFinished']){
            l[currIdx] = leftList[leftIdx]
            leftIdx += 1
        }
        else{
            l[currIdx] = rightList[rightIdx]
            rightIdx += 1
        }
        currIdx += 1
    }

    while (leftIdx < leftList.length){
        l[currIdx] = leftList[leftIdx]
        leftIdx += 1
        currIdx += 1
    }

    while (rightIdx < rightList.length){
        l[currIdx] = rightList[rightIdx]
        rightIdx += 1
        currIdx += 1
    }

    return l.slice(left, right); 
}
// ################################################################################
