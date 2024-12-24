chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleVisibility') {
      const { isVisible } = message;
      localStorage.setItem('toggleState', JSON.stringify(isVisible)); 
      const searchSections = document.getElementsByClassName('search-and-buttons-wrapper');
      Array.from(searchSections).forEach((section) => {
        section.style.display = isVisible ? 'flex' : 'none';
      });
  
      console.log(`Search sections are now ${isVisible ? 'visible' : 'hidden'}.`);
      sendResponse({ success: true });
    }
  });
  
function loadLibraryFromLocal(filePath) {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = chrome.runtime.getURL(filePath);
        script.type = "text/javascript";
        script.onload = () => {
            console.log(`${filePath} loaded successfully.`);
            resolve();
        };
        script.onerror = (err) => {
            console.error(`Failed to load script: ${filePath}`, err);
            reject(new Error(`Failed to load script: ${filePath}`));
        };
        document.head.appendChild(script);
    });
}

// Initialize the script
(async function initialize() {
    try {
        console.log("Loading libraries...");

         // Create Trusted Types policy
         const trustedPolicy = window.trustedTypes?.createPolicy('default', {
            createHTML: (input) => input,
        });

        // Load libraries dynamically
        await loadLibraryFromLocal("lib/font-awesome.js");
        await loadLibraryFromLocal("lib/xlsx.full.min.js");
        await loadLibraryFromLocal("lib/docx.js");
        await loadLibraryFromLocal("lib/html2canvas.js");
        await loadLibraryFromLocal("lib/jspdf.js");

        console.log("All libraries loaded successfully.");

       
        const savedState = localStorage.getItem('toggleState'); 
        console.log("savedState",savedState);

        if (savedState == null ) {
           localStorage.setItem('toggleState', false);             
        }
     
            processExistingTables(); 
            monitorDOMChanges();              
     

    } catch (error) {
        console.error("Error loading libraries:", error);
        alert("Error loading required libraries. Please check the console for details.");
    }
})();

// Process all existing tables in the DOM
function processExistingTables() {
    const tables = document.querySelectorAll("table");
    if (tables.length === 0) {
        console.log("No tables found on initial load.");
        return;
    }

    tables.forEach((table) => {
        injectSearchAndButtons(table);
    });
}

// Monitor DOM for dynamically added tables
function monitorDOMChanges() {
    const observer = new MutationObserver((mutationsList) => {
        mutationsList.forEach((mutation) => {
            if (mutation.type === "childList") {
                const addedTables = Array.from(mutation.addedNodes).filter(
                    (node) =>
                        node.nodeType === 1 && // Ensure it's an element node
                        (node.tagName === "TABLE" || node.querySelector("table"))
                );
    
                if (addedTables.length) {
                    console.log("New table(s) detected. Injecting export buttons...");
                    addedTables.forEach((table) => {
                        
                        if (table.tagName === "TABLE") {
                            injectSearchAndButtons(table);
                        } else {
                            const nestedTables = table.querySelectorAll("table");
                            nestedTables.forEach((nestedTable) => injectSearchAndButtons(nestedTable));
                        }
                    });
                }
            }
        });
    });
    
    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    console.log("DOM monitoring initialized for dynamic table detection.");
}

// Inject search bar and export buttons for a table
function injectSearchAndButtons(table) {
    if (table.previousElementSibling?.classList.contains("search-and-buttons-wrapper")) {
        return; // Prevent duplicate injection
    }

    const wrapper = document.createElement("div");
    wrapper.classList.add("search-and-buttons-wrapper");
    wrapper.style.display = "flex";
    wrapper.style.justifyContent = "space-between";
    wrapper.style.alignItems = "center";
    wrapper.style.margin = "20px";
    wrapper.style.gap = "10px";


     // Load toggle state from localStorage to set initial visibility
     const toggleState = JSON.parse(localStorage.getItem('toggleState')) || false;
     wrapper.style.display = toggleState ? "flex" : "none";
     

    // Create search input
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "   Search...";
    searchInput.style.flex = "1";
    searchInput.style.padding = "10px";
    searchInput.style.border = "1px solid #ccc";
    searchInput.style.borderRadius = "25px";
    searchInput.style.outline = "none";
    searchInput.style.boxShadow = "0px 2px 4px rgba(0, 0, 0, 0.1)";
    searchInput.style.transition = "all 0.2s ease-in-out";

    searchInput.addEventListener("focus", () => {
        searchInput.style.boxShadow = "0px 4px 8px rgba(0, 0, 0, 0.2)";
    });

    searchInput.addEventListener("blur", () => {
        searchInput.style.boxShadow = "0px 2px 4px rgba(0, 0, 0, 0.1)";
    });

    // Add event listener for search functionality
    searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();
        const rows = table.querySelectorAll("tbody tr");
        rows.forEach((row) => {
            const cells = Array.from(row.cells);
            const match = cells.some((cell) => cell.textContent.toLowerCase().includes(query));
            row.style.display = match ? "" : "none";
        });
    });

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.gap = "10px";

    // Create buttons
    const excelButton = createButtonWithIcon("Excel", "fa-file-excel", () => exportToExcel(table));
    const csvButton = createButtonWithIcon("CSV", "fa-file-csv", () => exportToCSV(table));
    const pdfButton = createButtonWithIcon("PDF", "fa-file-pdf", () => exportToPDF(table));
    const docsButton = createButtonWithIcon("Docs", "fa-file-word", () => exportToDocs(table));
    const printButton = createButtonWithIcon("Print", "fa-print", () => printTable(table));
    const clipboardButton = createButtonWithIcon("Copy to Clipboard", "fa-copy", () => copyToClipboard(table));

    // Append buttons to the container
    buttonContainer.append(excelButton, csvButton, pdfButton, docsButton, printButton, clipboardButton);

    // Append search input and button container to the wrapper
    wrapper.append(searchInput, buttonContainer);

    // Insert wrapper before the table
    table.parentNode.insertBefore(wrapper, table);
}

function createButtonWithIcon(label, iconClass, onClick) {
    const button = document.createElement("button");
    button.style.padding = "8px 10px";
    button.style.backgroundColor = "#007BFF";
    button.style.color = "white";
    button.style.border = "none";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    button.style.transition = "all 0.2s ease-in-out";
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.gap = "5px";
    button.style.fontSize = "14px";
    button.style.position = "relative";

    // Add hover effects
    button.addEventListener("mouseenter", () => {
        button.style.backgroundColor = "#0056b3";
    });
    button.addEventListener("mouseleave", () => {
        button.style.backgroundColor = "#007BFF";
    });

    // Create the icon
    const icon = document.createElement("i");
    icon.className = `fas ${iconClass}`;
    icon.style.fontSize = "16px";

    // Create the text label
    const text = document.createElement("span");
    text.textContent = label;
    text.style.display = "inline";

    
    // Append the icon and tooltip
    button.append(icon, text);

    button.addEventListener("click", onClick);

    return button;
}


function exportToExcel(table) {
    if (typeof XLSX === "undefined") {
        alert("XLSX library not loaded!");
        return;
    }

    // Create a new workbook and add a sheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.table_to_sheet(table);

    // Adjust column widths for a cleaner look
    const colWidths = Array.from(table.rows[0].cells).map((cell) => {
        return { wpx: Math.max(cell.textContent.length * 7, 70) }; // Minimum 70px, adjust based on content length
    });
    worksheet["!cols"] = colWidths;

    // Style header row
    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const headerCell = worksheet[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (headerCell) {
            headerCell.s = {
                font: { bold: true },
                fill: { fgColor: { rgb: "DDEBF7" } }, // Light blue background
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
    }

    // Append the styled worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cleaned Table");

    // Export the workbook as an Excel file
    const excelData = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });
    const blob = new Blob([s2ab(excelData)], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Table.xlsx";
    link.click();
}



function exportToCSV(table) {
    // Extract rows from the table
    const rows = Array.from(table.querySelectorAll("tr"));

    // Create the CSV content
    const csvContent = rows
        .map((row) =>
            Array.from(row.cells)
                .map((cell) => {
                    let content = cell.textContent.trim(); // Trim whitespace
                    content = content.replace(/"/g, '""'); // Escape double quotes
                    return `"${content}"`; // Wrap content in double quotes
                })
                .join(",") // Join cells with a comma
        )
        .join("\n"); // Join rows with a newline

    // Generate the CSV Blob
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

    // Create a download link and trigger the download
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Table.csv";
    link.click();
}


async function exportToPDF(table) {
    if (typeof html2pdf === "undefined") {
        alert("html2pdf library not loaded!");
        return;
    }

    const options = {
        margin: 10, // Margin in mm
        filename: 'table.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, scrollY: 0 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
    };

    try {
        await html2pdf().from(table).set(options).save();
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Failed to generate PDF. Please try again.");
    }
}

function exportToDocs(table) {
    if (typeof docx === "undefined") {
        alert("docx library not loaded!");
        return;
    }

    const { Document, Packer, Table, TableRow, TableCell, Paragraph, TextRun } = docx;

    const rows = Array.from(table.rows).map((row) =>
        Array.from(row.cells).map((cell) => new TableCell({
            children: [new Paragraph(cell.textContent.trim())],
        }))
    );

    const tableData = new Table({
        rows: rows.map((row) => new TableRow({ children: row })),
        width: {
            size: 100,
            type: "pct",
        },
    });

    const doc = new Document({
        sections: [
            {
                properties: {},
                children: [tableData],
            },
        ],
    });

    Packer.toBlob(doc).then((blob) => {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "table.docx";
        link.click();
    });
}


// Print table data
function printTable(table) {
    const newWindow = window.open("", "_blank");
    const tableHTML = table.outerHTML;

    newWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Print Table</title>
            <style>
                table { border-collapse: collapse; width: 100%; }
                table, th, td { border: 1px solid black; }
                th, td { padding: 8px; text-align: left; }
            </style>
        </head>
        <body>${tableHTML}</body>
        </html>
    `);
    newWindow.document.close();
    newWindow.print();
}

// Convert string to array buffer
function s2ab(s) {
    const buf = new ArrayBuffer(s.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < s.length; i++) {
        view[i] = s.charCodeAt(i) & 0xff;
    }
    return buf;
}

// Copy table data to clipboard
function copyToClipboard(table) {
    const rows = Array.from(table.rows).map((row) =>
        Array.from(row.cells).map((cell) => cell.textContent.trim()).join("\t")
    );

    const clipboardText = rows.join("\n");
    navigator.clipboard
        .writeText(clipboardText)
        .then(() => alert("Table data copied to clipboard."))
        .catch((err) => console.error("Failed to copy table:", err));
}
