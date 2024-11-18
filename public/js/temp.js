

/*
====================================================
? => Function to capture UTM parameters from URL
====================================================
*/
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(window.location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

/*
====================================================
? => Collect UTM parameters
====================================================
*/
const utmSource = getUrlParameter('utm_source');
const utmMedium = getUrlParameter('utm_medium');
const utmCampaign = getUrlParameter('utm_campaign');
const utmTerm = getUrlParameter('utm_term');
const utmContent = getUrlParameter('utm_content');

/*
====================================================
? => Function to send UTM data to backend
====================================================
*/



function sendUtmData() {
    if (utmSource || utmMedium || utmCampaign || utmTerm || utmContent) {
        fetch('/add-utm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                utm_source: utmSource,
                utm_medium: utmMedium,
                utm_campaign: utmCampaign,
                utm_term: utmTerm,
                utm_content: utmContent
            }),
        })
            .then(response => response.json())
            .then(data => {
                console.log('UTM data saved:', data);
                loadUtmData(); // Refresh the table after saving
            })
            .catch(error => {
                console.error('Error saving UTM data:', error);
            });
    }
}

/*
====================================================
? => Function to load and process UTM data from backend
====================================================
*/




function loadUtmData() {
    fetch('/utm-data')
        .then(response => response.json())
        .then(data => {
            const organizedData = processUtmData(data);
            renderUtmTable(organizedData); // Render the nested data structure
        })
        .catch(error => {
            console.error('Error fetching UTM data:', error);
        });
}

/*
====================================================
? => Process UTM data into structured format
====================================================
*/


function processUtmData(data) {
    const organizedData = { headers: {}, rows: {} };

    // Helper function to initialize nested objects
    const initNestedObject = (obj, keys, defaultValue) => {
        keys.reduce((acc, key, index) => {
            if (!acc[key]) acc[key] = index === keys.length - 1 ? defaultValue : {};
            return acc[key];
        }, obj);
    };

    // Process each item in the data
    data.forEach(item => {
        const date = item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : 'unknown-date';
        const source = item.utm_source || 'unknown-source';
        const medium = item.utm_medium || 'unknown-medium';
        const campaign = item.utm_campaign || 'unknown-campaign';
        const term = item.utm_term || 'unknown-term';
        const content = item.utm_content || 'unknown-content';

        // Initialize headers structure for source and medium, and add campaigns
        initNestedObject(organizedData.headers, [source, medium], new Set());
        organizedData.headers[source][medium].add(campaign);

        // Initialize rows structure for the given date, source, medium, and campaign
        initNestedObject(organizedData.rows, [date, source, medium], { total: 0, campaigns: {} });
        initNestedObject(organizedData.rows[date][source][medium].campaigns, [campaign], { terms: {}, total: 0, count: 0 });

        // Increment total counts for the source, medium, campaign
        organizedData.rows[date][source][medium].total++;
        organizedData.rows[date][source][medium].campaigns[campaign].total++;
        organizedData.rows[date][source][medium].campaigns[campaign].count++;

        // Handle terms and content
        initNestedObject(organizedData.rows[date][source][medium].campaigns[campaign].terms, [term], {});
        organizedData.rows[date][source][medium].campaigns[campaign].terms[term][content] =
            (organizedData.rows[date][source][medium].campaigns[campaign].terms[term][content] || 0) + 1;
    });

    // Convert `Set` to `Array` in headers for easier rendering
    for (let source in organizedData.headers) {
        for (let medium in organizedData.headers[source]) {
            organizedData.headers[source][medium] = Array.from(organizedData.headers[source][medium]);
        }
    }

    return organizedData;
}


/*
====================================================
? => Render UTM data into the table
====================================================
*/



//! Render this table when Source, Medium, Campaign, and Term

function renderUtmSourceMediumCampaignTermTable(utmData) {
    const table = document.getElementById('utm-table');
    const thead = table.querySelector('thead');
    const tbody = document.getElementById('utm-data');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Helper function to format the date to dd-mm-yyyy
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // Row 1: Source Headers
    const categoryRow = document.createElement('tr');
    categoryRow.innerHTML = `<th class="align-middle text-left">Source</th>`;

    Object.keys(utmData.headers).forEach(source => {
        let mediumCount = 0;
        let colspan = 0;
        console.log('Source:', source);
        
        if (utmData.headers[source]) {
            for (let medium in utmData.headers[source]) {
                if (utmData.headers[source][medium]) {
                    console.log('Medium:', medium);
                    let campaignCount = utmData.headers[source][medium].length;
                    for (let campaign of utmData.headers[source][medium]) {
                        console.log('Campaign:', campaign.name);
                        if (campaign.terms) {
                            let termCount = campaign.terms.length;
                            console.log('Terms:', campaign.terms);
                            colspan += termCount; // Add term counts
                        }
                    }
                    colspan += campaignCount; // Add one "Total" column per medium
                }
            }
        }
        categoryRow.innerHTML += `<th class="align-middle text-center" colspan="${colspan}">${source}</th>`;
    });
    categoryRow.innerHTML += `<th class="align-middle text-center" rowspan="4">Grand Total</th>`;
    thead.appendChild(categoryRow);

    // Row 2: Medium Headers
    const mediumRow = document.createElement('tr');
    mediumRow.innerHTML = `<th class="align-middle text-left">Medium</th>`;

    Object.keys(utmData.headers).forEach(source => {
        if (utmData.headers[source]) {
            for (let medium in utmData.headers[source]) {
                if (utmData.headers[source][medium]) {
                    let campaignCount = utmData.headers[source][medium].length; // Count campaigns
                    mediumRow.innerHTML += `<th class="align-middle text-center" colspan="${campaignCount}">${medium}</th>`;
                    mediumRow.innerHTML += `<th class="align-middle text-center" rowspan="3">Total</th>`;
                }
            }
        }
    });
    thead.appendChild(mediumRow);

    // Row 3: Campaign Headers
    const campaignRow = document.createElement('tr');
    campaignRow.innerHTML = `<th class="align-middle text-left">Campaign</th>`;

    Object.keys(utmData.headers).forEach(source => {
        if (utmData.headers[source]) {
            for (let medium in utmData.headers[source]) {
                if (utmData.headers[source][medium]) {
                    utmData.headers[source][medium].forEach(campaign => {
                        console.log('Campaign Name:', campaign.name);
                        campaignRow.innerHTML += `<td class="align-middle text-center">${campaign.name}</td>`;
                    });
                }
            }
        }
    });
    thead.appendChild(campaignRow);

    // Row 4: Term Headers
    const termRow = document.createElement('tr');
    termRow.innerHTML = `<th class="align-middle text-left">Term</th>`;

    Object.keys(utmData.headers).forEach(source => {
        if (utmData.headers[source]) {
            for (let medium in utmData.headers[source]) {
                if (utmData.headers[source][medium]) {
                    utmData.headers[source][medium].forEach(campaign => {
                        if (campaign.terms) {
                            campaign.terms.forEach(term => {
                                console.log('Term:', term);
                                termRow.innerHTML += `<td class="align-middle text-center">${term}</td>`;
                            });
                        }
                    });
                }
            }
        }
    });
    thead.appendChild(termRow);

    // Populate the rows dynamically with the data from `utmData.rows`
    Object.keys(utmData.rows).forEach(dateStr => {
        const row = document.createElement('tr');
        const formattedDate = formatDate(dateStr); // Format the date here
        row.innerHTML = `<th class="align-middle text-left">${formattedDate}</th>`;

        let grandTotal = 0;

        Object.keys(utmData.headers).forEach(source => {
            const sourceData = utmData.rows[dateStr][source] || {};

            if (utmData.headers[source]) {
                Object.keys(utmData.headers[source]).forEach(medium => {
                    const mediumData = sourceData[medium] || { total: 0, campaigns: {} };

                    let mediumTotal = mediumData.total;

                    if (utmData.headers[source][medium]) {
                        utmData.headers[source][medium].forEach(campaign => {
                            const campaignData = mediumData.campaigns[campaign.name] || { total: 0, terms: {} };

                            // For each term
                            if (campaign.terms) {
                                campaign.terms.forEach(term => {
                                    const termData = campaignData.terms[term] || { count: 0 };
                                    row.innerHTML += `<td class="align-middle text-center">${termData.count}</td>`;
                                    mediumTotal += termData.count;
                                });
                            }

                            row.innerHTML += `<th class="align-middle text-center">${campaignData.total}</th>`;
                            mediumTotal += campaignData.total;
                        });
                    }

                    row.innerHTML += `<th class="align-middle text-center">${mediumTotal}</th>`;
                    grandTotal += mediumTotal;
                });
            }
        });

        row.innerHTML += `<th class="align-middle text-center">${grandTotal}</th>`;
        tbody.appendChild(row);
    });
}






//! //! Render this table when Source, Medium and Campain  
   
function renderUtmSourceMediumCampainTable(utmData) {
    const table = document.getElementById('utm-table');
    const thead = table.querySelector('thead');
    const tbody = document.getElementById('utm-data');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Helper function to format the date to dd-mm-yyyy
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // Create the first header row for sources
    const categoryRow = document.createElement('tr');
    categoryRow.innerHTML = `<th class="align-middle text-left">Source</th>`;

    Object.keys(utmData.headers).forEach(source => {
        let mediumCount = Object.keys(utmData.headers[source]).length;
        let colspan = 0;
        for (let medium in utmData.headers[source]) {
            colspan += utmData.headers[source][medium].length; // Add campaigns under each medium
        }
        colspan += mediumCount; // Add one "Total" column per medium
        categoryRow.innerHTML += `<th class="align-middle text-center" colspan="${colspan}">${source}</th>`;
    });
    categoryRow.innerHTML += `<th class="align-middle text-center" rowspan="3">Grand Total</th>`;
    thead.appendChild(categoryRow);

    // Create the second header row for mediums
    const mediumRow = document.createElement('tr');
    mediumRow.innerHTML = `<th class="align-middle text-left">Medium</th>`;

    Object.keys(utmData.headers).forEach(source => {
        for (let medium in utmData.headers[source]) {
            let campaignCount = utmData.headers[source][medium].length; // Count campaigns
            mediumRow.innerHTML += `<th class="align-middle text-center" colspan="${campaignCount}">${medium}</th>`;
            mediumRow.innerHTML += `<th class="align-middle text-center" rowspan="2">Total</th>`;
        }
    });
    thead.appendChild(mediumRow);

    // Create the third header row for campaigns
    const campaignRow = document.createElement('tr');
    campaignRow.innerHTML = `<th class="align-middle text-left">Campaign</th>`;

    Object.keys(utmData.headers).forEach(source => {
        for (let medium in utmData.headers[source]) {
            utmData.headers[source][medium].forEach(campaign => {
                campaignRow.innerHTML += `<td class="align-middle text-center">${campaign}</td>`;
            });
        }
    });
    thead.appendChild(campaignRow);

    // Populate the rows dynamically with the data from `utmData.rows`
    Object.keys(utmData.rows).forEach(dateStr => {
        const row = document.createElement('tr');
        const formattedDate = formatDate(dateStr); // Format the date here
        row.innerHTML = `<th class="align-middle text-left">${formattedDate}</th>`;

        let grandTotal = 0;
        Object.keys(utmData.headers).forEach(source => {
            const sourceData = utmData.rows[dateStr][source] || {};

            Object.keys(utmData.headers[source]).forEach(medium => {
                const mediumData = sourceData[medium] || { total: 0, campaigns: {} };

                utmData.headers[source][medium].forEach(campaign => {
                    const campaignData = mediumData.campaigns[campaign] || { count: 0 };
                    row.innerHTML += `<td class="align-middle text-center">${campaignData.count}</td>`;
                });

                row.innerHTML += `<th class="align-middle text-center">${mediumData.total}</th>`;
                grandTotal += mediumData.total;
            });
        });

        row.innerHTML += `<th class="align-middle text-center">${grandTotal}</th>`;
        tbody.appendChild(row);
    });
}





//! Render this table when Source and Medium Are checked  


function renderUtmSourceMediumTable(utmData) {
    const table = document.getElementById('utm-table');
    const thead = table.querySelector('thead');
    const tbody = document.getElementById('utm-data');
    
    thead.innerHTML = '';
    tbody.innerHTML = '';

    // Helper function to format the date to dd-mm-yyyy
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
    }

    // Create the first header row with dynamic category spans
    const categoryRow = document.createElement('tr');
    categoryRow.innerHTML = `<th class="align-middle text-left">Source</th>`;

    // Loop through sources and dynamically create columns for each source
    Object.keys(utmData.headers).forEach(source => {
        const mediums = Array.isArray(utmData.headers[source]) ? utmData.headers[source] : Object.keys(utmData.headers[source]);
        const colspan = mediums.length + 1; // Add one for the total column
        categoryRow.innerHTML += `<th class="align-middle text-center" colspan="${colspan}">${source}</th>`;
    });
    categoryRow.innerHTML += `<th class="align-middle text-center" rowspan="2">Grand Total</th>`;
    thead.appendChild(categoryRow);

    // Create the second header row with individual medium headers and total
    const mediumRow = document.createElement('tr');
    mediumRow.innerHTML = `<th class="align-middle text-left">Medium</th>`;

    // Loop through sources and their mediums to create medium headers
    Object.keys(utmData.headers).forEach(source => {
        const mediums = Array.isArray(utmData.headers[source]) ? utmData.headers[source] : Object.keys(utmData.headers[source]);
        mediums.forEach(medium => {
            mediumRow.innerHTML += `<th class="align-middle text-center">${medium}</th>`;
        });
        mediumRow.innerHTML += `<th class="align-middle text-center total-field">Total</th>`; // Total column for each source
    });
    thead.appendChild(mediumRow);

    // Populate the rows dynamically with the data from `utmData.rows`
    Object.keys(utmData.rows).forEach(date => {
        const row = document.createElement('tr');
        
        // Format the date here
        const formattedDate = formatDate(date);
        row.innerHTML = `<th class="align-middle text-left">${formattedDate}</th>`; // Add the formatted date in the first column

        let grandTotal = 0;
        
        // Loop through each source and its mediums
        Object.keys(utmData.headers).forEach(source => {
            const sourceData = utmData.rows[date][source] || {};
            let sourceTotal = 0;

            // Get mediums associated with the current source
            const mediums = Array.isArray(utmData.headers[source]) ? utmData.headers[source] : Object.keys(utmData.headers[source]);

            mediums.forEach(medium => {
                // Handle the data for the medium
                const mediumData = sourceData[medium] || { total: 0 };
                row.innerHTML += `<td class="align-middle text-center">${mediumData.total}</td>`; // Add medium data
                sourceTotal += mediumData.total; // Accumulate total for this source
            });

            // Add the total column for this source
            row.innerHTML += `<th class="align-middle text-center total-value">${sourceTotal}</th>`;
            grandTotal += sourceTotal; // Accumulate grand total
        });

        // Add the grand total column for the row
        row.innerHTML += `<th class="align-middle text-center">${grandTotal}</th>`;
        tbody.appendChild(row);
    });
}





