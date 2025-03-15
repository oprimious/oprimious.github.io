document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.getElementById("searchInput");
    const resultDiv = document.getElementById("result");
    const searchBtn = document.getElementById("searchBtn");
    const barcodeBtn = document.getElementById("barcodeBtn");
    const dataMatrixBtn = document.getElementById("dataMatrixBtn");
    const scannerContainer = document.getElementById("scanner-container");

    async function fetchMedication(query) {
        try {
            query = query.trim();
            let type = /^[0-9]+$/.test(query) ? "gtin" : "nm"; 
    
            console.log(`Searching for: ${query} (Type: ${type})`);
    
            const response = await fetch(`https://medication-api-test.onrender.com/search?query=${encodeURIComponent(query)}&type=${type}`);
    
            if (!response.ok) {
                resultDiv.innerHTML = `<p class="no-results">${response.status === 404 ? "No matching medication found." : `Server error: ${response.status} ${response.statusText}`}</p>`;
                resultDiv.style.display = "block";
                return;
            }
    
            const data = await response.json();
    
            if (!Array.isArray(data) || data.length === 0) {
                resultDiv.innerHTML = `<p class="no-results">No matching medication found.</p>`;
                resultDiv.style.display = "block";
                return;
            }
    
            let resultHTML = "<h2>Search Results</h2>";
            data.forEach(item => {
                resultHTML += `
                    <div class="medication-card">
                        <p><strong>Medication Name:</strong> ${item.NM}</p>
                        <p><strong>GTIN:</strong> ${item.GTIN}</p>
                        <p><strong>APPID:</strong> ${item.APPID}</p>
                    </div>
                `;
            });
    
            resultDiv.innerHTML = resultHTML;
            resultDiv.style.display = "block";
        } catch (error) {
            console.error("Error fetching data:", error);
            resultDiv.innerHTML = `<p class="no-results">Error fetching medication details: ${error.message}</p>`;
            resultDiv.style.display = "block";
        }
    }

    function startZXingScanner(targetElementId, onSuccess, applyZoom = false) {
        scannerContainer.innerHTML = `<video id="${targetElementId}" autoplay playsinline></video>`;
        scannerContainer.style.display = "block";
    
        // Create a fresh video stream every time
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                stream.getTracks().forEach(track => track.stop()); // Close any previous streams
    
                // Define new constraints
                const constraints = {
                    video: {
                        facingMode: "environment",
                        width: { ideal: applyZoom ? 640 : 1280 }, // 🔹 Smaller width if zooming in
                        height: { ideal: applyZoom ? 480 : 720 }, // 🔹 Smaller height if zooming in
                        aspectRatio: applyZoom ? 4 / 3 : 16 / 9 // 🔹 Wider view for barcode
                    }
                };
    
                if (applyZoom) {
                    constraints.video.zoom = 2; // Apply zoom only for Data Matrix
                }
    
                // Start new camera stream
                navigator.mediaDevices.getUserMedia(constraints)
                    .then((newStream) => {
                        const video = document.getElementById(targetElementId);
                        video.srcObject = newStream;
    
                        const track = newStream.getVideoTracks()[0];
                        const capabilities = track.getCapabilities();
    
                        if (applyZoom && capabilities.zoom) {
                            track.applyConstraints({ advanced: [{ zoom: 2 }] }) // Only Data Matrix
                                .catch((err) => console.error("Zoom not supported:", err));
                        }
    
                        const codeReader = new ZXing.BrowserMultiFormatReader();
                        codeReader.decodeFromVideoDevice(null, targetElementId, (result, err) => {
                            if (result) {
                                console.log("Code detected:", result.text);
                                onSuccess(result.text);
                                codeReader.reset();
                                newStream.getTracks().forEach(track => track.stop()); // Stop camera
                                scannerContainer.style.display = "none";
                            }
                            if (err) {
                                console.error("Scanning error:", err);
                            }
                        });
    
                        // Stop button
                        const stopBtn = document.createElement('button');
                        stopBtn.textContent = 'Stop Scanner';
                        stopBtn.classList.add('stop-btn');
                        stopBtn.onclick = () => {
                            codeReader.reset();
                            newStream.getTracks().forEach(track => track.stop()); // Stop camera
                            scannerContainer.style.display = "none";
                        };
                        scannerContainer.appendChild(stopBtn);
                    })
                    .catch((err) => {
                        console.error("Camera access error:", err);
                        scannerContainer.innerHTML = `<p>Unable to access camera: ${err.message}</p>`;
                    });
            })
            .catch((err) => {
                console.error("Error resetting camera stream:", err);
            });
    }
    
    // 🔹 Barcode Scanner (No Zoom)
    barcodeBtn.addEventListener("click", function () {
        startZXingScanner("barcodeScanner", (code) => {
            if (code.match(/\(?01\)?\d{14}/)) {
                console.warn("invalid."); // have to do ts cuz zxing scans both 
                resultDiv.innerHTML = "<p>Data Matrix scanning required for this input.</p>";
                resultDiv.style.display = "block";
                return; // Stops further execution
            }
            searchInput.value = code;
            fetchMedication(code);
        }, true);
    });
    
    // 🔹 Data Matrix Scanner (With Zoom)
    dataMatrixBtn.addEventListener("click", function () {
        startZXingScanner("dataMatrixScanner", (decodedText) => {
            console.log("Data Matrix detected:", decodedText);
    
            const gtinMatch = decodedText.match(/\(?01\)?(\d{14})/);
            if (gtinMatch) {
                let gtin = gtinMatch[1].trim().replace(/\u001D/g, "").replace(/^0+/, "");
                console.log("Extracted GTIN:", gtin);
                searchInput.value = gtin;
                setTimeout(() => {
                    fetchMedication(gtin);
                }, 500);
            } else {
                resultDiv.innerHTML = "<p>No GTIN found in scanned Data Matrix.</p>";
                resultDiv.style.display = "block";
                console.error("GTIN not found in Data Matrix: ", decodedText);
            }
        }, true); // 🔹 Enable zoom for Data Matrix only
    });
    
    

    searchBtn.addEventListener("click", function () {
        const query = searchInput.value.trim(); // Get the value and remove spaces
    
        if (!query) {
            console.warn("Search input is empty!");
            resultDiv.innerHTML = "<p>Please enter a name or GTIN to search.</p>";
            resultDiv.style.display = "block";
            return;
        }
    
        console.log(`🔎 Searching for: "${query}"`);
        fetchMedication(query); // Call search function
    });
    
});
