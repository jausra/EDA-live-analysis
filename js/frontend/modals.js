//Get the modals. 
const leftModal = document.getElementById('leftModal');
const centralModalWrapper = document.getElementById('centralModalWrapper');
const rightModal = document.getElementById('rightModal');

//Get the buttons that control the modal sizes. 
const leftModalButton = document.getElementById('leftModalButton');
const rightModalButton = document.getElementById('rightModalButton');

//Define left and right arrows. 
const leftArrow = "&#9664;";
const rightArrow = "&#9654;";

//Function to collapse the left modal and show only the central modal. Called upon start and resume. 
export function showCentralModal() {
    leftModal.classList.toggle("collapsed"); //Collapse the left modal. 
    leftModalButton.innerHTML = rightArrow; //Make the left modal button point left. 
    centralModalWrapper.classList.add("shifted"); //Set the central modal width to 50% of the screen width. 
}

//Toggle the left modal
leftModalButton.addEventListener("click", () => {
    const collapsed = leftModal.classList.toggle("collapsed"); //Toggle whether the left modal is collapsed or expanded. 
    if (!rightModal.classList.contains("collapsed")) { //Collapse the right modal. 
        rightModal.classList.add("collapsed");
        rightModalButton.innerHTML = leftArrow;
    }
    if (collapsed) { //If the left modal is collapsed, set the central modal width to 50%. 
        centralModalWrapper.classList.add("shifted");
        leftModalButton.innerHTML = rightArrow;  
    } else { //If the left modal is expanded, set the central modal to flex mode. 
        centralModalWrapper.classList.remove("shifted");
        leftModalButton.innerHTML = leftArrow;
    }
});

//Toggle the right modal
rightModalButton.addEventListener("click", () => {
    const collapsed = rightModal.classList.toggle("collapsed"); //Toggle whether the right modal is collapsed or expanded. 
    if (!leftModal.classList.contains("collapsed")) { //Collapse the left modal. 
        leftModal.classList.add("collapsed");
        rightModalButton.innerHTML = rightArrow;
    }
    if (collapsed) { //If the right modal is collapsed, set the central modal width to 50%. 
        centralModalWrapper.classList.add("shifted");
        rightModalButton.innerHTML = leftArrow;
    } else { //If the right modal is expanded, set the central modal to flex mode. 
        centralModalWrapper.classList.remove("shifted");
        rightModalButton.innerHTML = rightArrow;
    }
});