/*
====================================================
? => Filters Handling Code :--
====================================================
*/

const sourceCheckbox = document.getElementById("source-checkbox");
const mediumCheckbox = document.getElementById("medium-checkbox");
const campaignCheckbox = document.getElementById("campaign-checkbox");
const termCheckbox = document.getElementById("term-checkbox"); // Added term checkbox

function renderTableBasedOnCheckboxes(utmData) {
    const isSourceChecked = sourceCheckbox.checked;
    const isMediumChecked = mediumCheckbox.checked;
    const isCampaignChecked = campaignCheckbox.checked;
    const isTermChecked = termCheckbox?.checked; // Safely check if term checkbox exists

    if (isSourceChecked && isMediumChecked && isCampaignChecked && isTermChecked) {
        renderUtmSourceMediumCampaignTermTable(utmData); // Call the new function
    } else if (isSourceChecked && isMediumChecked && isCampaignChecked) {
        renderUtmSourceMediumCampainTable(utmData); 
    } else if (isSourceChecked && isMediumChecked) {
        renderUtmSourceMediumTable(utmData); 
    } else if (isSourceChecked) {
        renderUtmSourceTable(utmData); // Example: Handle source-only case
    } else {
        console.log("No matching combination or incomplete logic.");
    }
}

// Add event listeners to all checkboxes
[sourceCheckbox, mediumCheckbox, campaignCheckbox, termCheckbox].forEach(checkbox => {
    if (checkbox) { // Ensure the checkbox exists
        checkbox.addEventListener("change", () => {
            loadUtmData(); 
        });
    }
});

function loadUtmData() {
    fetch('/utm-data')
        .then(response => response.json())
        .then(data => {
            const organizedData = processUtmData(data);
            renderTableBasedOnCheckboxes(organizedData); 
        })
        .catch(error => {
            console.error('Error fetching UTM data:', error);
        });
}

window.onload = () => {
    sendUtmData();  
    loadUtmData();  
};

// document.getElementById("view-button").addEventListener("click", () => {
//     const month = document.getElementById("month-filter").value;
//     const year = document.getElementById("year-filter").value;

//     if (!month || !year) {
//         alert("Please select both month and year!");
//         return;
//     }

//     fetchDataForMonthYear(month, year);
// });

// function fetchDataForMonthYear(month, year) {
//     // Check if month and year are provided
//     if (!month || !year) {
//         alert("Please select both month and year.");
//         return;
//     }

//     // Assuming the backend URL where the UTM data is fetched from
//     const url = `/utm-data?month=${month}&year=${year}`; 

//     fetch(url)
//         .then(response => {
//             if (!response.ok) {
//                 throw new Error("Failed to fetch data.");
//             }
//             return response.json();
//         })
//         .then(data => {
//             loadUtmData(data); // Function to handle and display the fetched data
//         })
//         .catch(error => {
//             console.error("Error fetching data:", error);
//             alert("An error occurred while fetching data. Please try again.");
//         });
// }