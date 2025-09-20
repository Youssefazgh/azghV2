let currentDevice = null;
const devices = {};

// Zufällige Daten generieren
function getRandomRoom() {
    const rooms = [
        '1.02', '1.03', '1.04', '1.05', '1.06', '1.07', '1.08',
        '2.01', '2.02', '2.03', '2.04', '2.05', '2.06', '2.07',
        '3.01', '3.02', '3.03', '3.04', '3.05', '3.06', '3.07',
        '4.01', '4.02', '4.03', '4.04', '4.05', '4.06', '4.07'
    ];
    return rooms[Math.floor(Math.random() * rooms.length)];
}

function getRandomDate() {
    const start = new Date(2024, 0, 1);
    const end = new Date();
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Device-Daten initialisieren
function initializeDevices() {
    for (let i = 1; i <= 900; i++) {
        devices[i] = {
            number: i,
            room: getRandomRoom(),
            status: Math.random() > 0.7 ? 'ausgeliehen' : 'verfügbar', // 30% ausgeliehen
            lastMaintenance: getRandomDate().toLocaleDateString('de-DE')
        };
    }
    
    // Status in localStorage speichern falls vorhanden
    const savedStates = localStorage.getItem('deviceStates');
    if (savedStates) {
        const states = JSON.parse(savedStates);
        Object.keys(states).forEach(deviceId => {
            if (devices[deviceId]) {
                devices[deviceId].status = states[deviceId] ? 'ausgeliehen' : 'verfügbar';
            }
        });
    }
}

// Device-Status speichern
function saveDeviceStates() {
    const states = {};
    Object.keys(devices).forEach(id => {
        states[id] = devices[id].status === 'ausgeliehen';
    });
    localStorage.setItem('deviceStates', JSON.stringify(states));
}

// Hauptansicht generieren
function generateMainView() {
    const grid = document.getElementById('device-grid');
    grid.innerHTML = '<div class="loading">Lade Geräte...</div>';
    
    // Simulate loading für bessere UX
    setTimeout(() => {
        grid.innerHTML = '';
        
        for (let i = 1; i <= 900; i++) {
            const device = devices[i];
            
            const deviceCard = document.createElement('div');
            deviceCard.className = 'device-card';
            deviceCard.setAttribute('data-device', i);
            
            deviceCard.innerHTML = `
                <div class="device-header">device${i}</div>
                <div class="device-title">Device ${i}</div>
                <div class="device-info">Raum ${device.room}</div>
                <div class="status ${device.status === 'ausgeliehen' ? 'borrowed' : ''}">
                    Status: ${device.status}
                </div>
                <div class="device-actions">
                    <button class="btn" onclick="showDeviceDetails(${i})">📋 Details</button>
                    <button class="btn ${device.status === 'verfügbar' ? 'primary' : 'success'}" onclick="toggleStatus(${i})">
                        ${device.status === 'verfügbar' ? 'Ausleihen' : 'Zurückgeben'}
                    </button>
                </div>
            `;
            
            grid.appendChild(deviceCard);
        }
    }, 300);
}

// Device Details anzeigen
function showDeviceDetails(deviceNumber) {
    currentDevice = deviceNumber;
    const device = devices[deviceNumber];
    
    // URL ändern für Deep-Linking
    history.pushState({ device: deviceNumber }, '', `#device${deviceNumber}`);
    
    // Details füllen
    document.getElementById('detail-title').textContent = `Device ${deviceNumber}`;
    document.getElementById('detail-number').textContent = deviceNumber;
    document.getElementById('detail-location').textContent = `Raum ${device.room}`;
    document.getElementById('detail-status').textContent = device.status;
    document.getElementById('detail-maintenance').textContent = device.lastMaintenance;
    
    // Status-Button anpassen
    const toggleBtn = document.getElementById('toggle-status-detail');
    toggleBtn.textContent = device.status === 'verfügbar' ? 'Ausleihen' : 'Zurückgeben';
    toggleBtn.className = device.status === 'verfügbar' ? 'btn primary' : 'btn success';
    
    // Ansichten wechseln
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('device-detail').style.display = 'block';
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Zurück zur Hauptansicht
function showMainView() {
    history.pushState({}, '', window.location.pathname);
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('device-detail').style.display = 'none';
    currentDevice = null;
}

// Status umschalten (in Hauptansicht)
function toggleStatus(deviceNumber) {
    const device = devices[deviceNumber];
    const oldStatus = device.status;
    device.status = device.status === 'verfügbar' ? 'ausgeliehen' : 'verfügbar';
    
    // UI aktualisieren
    const card = document.querySelector(`[data-device="${deviceNumber}"]`);
    if (card) {
        const statusElement = card.querySelector('.status');
        const buttonElement = card.querySelector('.btn.primary, .btn.success');
        
        statusElement.textContent = `Status: ${device.status}`;
        statusElement.className = device.status === 'ausgeliehen' ? 'status borrowed' : 'status';
        
        buttonElement.textContent = device.status === 'verfügbar' ? 'Ausleihen' : 'Zurückgeben';
        buttonElement.className = device.status === 'verfügbar' ? 'btn primary' : 'btn success';
    }
    
    // Speichern
    saveDeviceStates();
    
    // Notification
    showNotification(`Device ${deviceNumber} ist jetzt ${device.status}!`);
}

// Status umschalten (in Detailansicht)
function toggleDeviceStatus() {
    if (currentDevice) {
        toggleStatus(currentDevice);
        showDeviceDetails(currentDevice); // Detail-Ansicht aktualisieren
    }
}

// Device-Link kopieren
function copyDeviceLink() {
    if (currentDevice) {
        const url = `${window.location.origin}${window.location.pathname}#device${currentDevice}`;
        navigator.clipboard.writeText(url).then(() => {
            showNotification(`Link für Device ${currentDevice} wurde kopiert!`);
        }).catch(() => {
            // Fallback für ältere Browser
            const textArea = document.createElement('textarea');
            textArea.value = url;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            showNotification(`Link für Device ${currentDevice} wurde kopiert!`);
        });
    }
}

// QR-Code anzeigen
function showQRCode() {
    if (currentDevice) {
        const url = `${window.location.origin}${window.location.pathname}#device${currentDevice}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
        
        const popup = window.open('', '_blank', 'width=400,height=500,scrollbars=yes');
        if (popup) {
            popup.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>QR-Code Device ${currentDevice}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 20px; 
                            background: #f8f9fa;
                        }
                        .qr-container {
                            background: white;
                            padding: 20px;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            display: inline-block;
                        }
                        .qr-title {
                            color: #dc3545;
                            margin-bottom: 15px;
                            font-size: 18px;
                            font-weight: bold;
                        }
                        .qr-url {
                            font-size: 12px;
                            color: #666;
                            margin-top: 15px;
                            word-break: break-all;
                            background: #f8f9fa;
                            padding: 10px;
                            border-radius: 4px;
                        }
                        .download-btn {
                            background: #dc3545;
                            color: white;
                            border: none;
                            padding: 10px 20px;
                            border-radius: 4px;
                            cursor: pointer;
                            margin-top: 15px;
                        }
                        .download-btn:hover {
                            background: #c82333;
                        }
                    </style>
                </head>
                <body>
                    <div class="qr-container">
                        <div class="qr-title">Device ${currentDevice}</div>
                        <img src="${qrUrl}" alt="QR Code" style="max-width: 300px;">
                        <div class="qr-url">${url}</div>
                        <button class="download-btn" onclick="downloadQR()">📥 QR-Code herunterladen</button>
                    </div>
                    <script>
                        function downloadQR() {
                            const link = document.createElement('a');
                            link.href = '${qrUrl}';
                            link.download = 'Device-${currentDevice}-QR.png';
                            link.click();
                        }
                    </script>
                </body>
                </html>
            `);
            popup.document.close();
        } else {
            showNotification('Popup wurde blockiert. Bitte erlaube Popups für diese Seite.');
        }
    }
}

// Suchfunktion
function searchDevices() {
    const searchTerm = document.getElementById('search').value.toLowerCase();
    const cards = document.querySelectorAll('.device-card');
    let visibleCount = 0;
    
    cards.forEach(card => {
        const deviceNumber = card.getAttribute('data-device');
        const deviceText = card.textContent.toLowerCase();
        
        if (deviceNumber.includes(searchTerm) || deviceText.includes(searchTerm) || searchTerm === '') {
            card.style.display = 'block';
            visibleCount++;
        } else {
            card.style.display = 'none';
        }
    });
    
    // Suchstatistik anzeigen
    if (searchTerm && visibleCount === 0) {
        const grid = document.getElementById('device-grid');
        const noResults = document.createElement('div');
        noResults.className = 'loading';
        noResults.innerHTML = `Keine Geräte gefunden für "${searchTerm}"`;
        grid.appendChild(noResults);
    }
}

// Notification anzeigen
function showNotification(message) {
    // Entferne alte Notifications
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    // Erstelle neue Notification
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove nach 3 Sekunden
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Deep-Linking: URL-Hash verarbeiten
function handleUrlHash() {
    const hash = window.location.hash;
    if (hash.startsWith('#device')) {
        const deviceNumber = parseInt(hash.replace('#device', ''));
        if (deviceNumber >= 1 && deviceNumber <= 900) {
            // Kleine Verzögerung für bessere UX
            setTimeout(() => {
                showDeviceDetails(deviceNumber);
            }, 100);
            return;
        }
    }
    showMainView();
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // ESC: Zurück zur Hauptansicht
    if (e.key === 'Escape' && currentDevice) {
        showMainView();
    }
    
    // Strg + F: Fokus auf Suchfeld
    if (e.ctrlKey && e.key === 'f') {
        e.preventDefault();
        document.getElementById('search').focus();
    }
    
    // Eingabe: Fokus auf Suchfeld
    if (e.key.length === 1 && !currentDevice && !e.ctrlKey && !e.altKey) {
        const searchField = document.getElementById('search');
        if (document.activeElement !== searchField) {
            searchField.focus();
            searchField.value = e.key;
        }
    }
});

// Event Listeners
window.addEventListener('hashchange', handleUrlHash);
window.addEventListener('popstate', handleUrlHash);

// Performance: Lazy Loading für große Listen
function setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        });
        
        // Observe all device cards
        document.querySelectorAll('.device-card').forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            observer.observe(card);
        });
    }
}

// Initialisierung
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Geräteverwaltung wird geladen...');
    
    initializeDevices();
    generateMainView();
    
    // URL-Hash beim ersten Laden verarbeiten
    setTimeout(() => {
        handleUrlHash();
    }, 500);
    
    console.log('✅ Geräteverwaltung geladen - 900 Devices verfügbar!');
    console.log('💡 Shortcuts: ESC = Zurück, Strg+F = Suchen, Tippen = Suchen');
    
    // Setup lazy loading nach dem Laden
    setTimeout(setupIntersectionObserver, 1000);
});