document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 50,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Timer animation
    let countdown = 480; // 8 minutes in seconds
    const timerText = document.querySelector('.timer-text');
    const timer = document.querySelector('.timer');
    
    function updateTimer() {
        const minutes = Math.floor(countdown / 60);
        const seconds = countdown % 60;
        timerText.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        const progress = (480 - countdown) / 480 * 100;
        timer.style.background = `conic-gradient(var(--secondary) ${progress}%, transparent ${progress}%)`;
        
        if (countdown > 0) {
            countdown--;
            setTimeout(updateTimer, 1000);
        }
    }
    
    // Start timer when scrolled into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateTimer();
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    if (document.querySelector('#timing')) {
        observer.observe(document.querySelector('#timing'));
    }

    // Battleship Game Implementation
    class BattleshipGame {
        constructor() {
            this.gridSize = 8;
            this.ships = [
                { size: 4, name: 'Battleship' },
                { size: 3, name: 'Cruiser' },
                { size: 3, name: 'Submarine' },
                { size: 2, name: 'Destroyer' },
                { size: 2, name: 'Patrol' }
            ];
            this.grid = Array(this.gridSize * this.gridSize).fill(null);
            this.hits = 0;
            this.shots = 0;
            this.shipsRemaining = this.ships.length;
            this.shipLocations = new Set();
            this.selectedClass = null; // Track selected character class
            this.usedAbilities = {
                attacker: { nuke: false, annihilate: false },
                defender: { counter: false, jam: false },
                supporter: { hacker: false, moreHelp: false, scanner: false }
            };
            this.counterActive = false;
            this.jamActive = false;
            this.annihilateActive = false;
            
            this.initializeGame();

            // Add class button event listeners
            document.querySelectorAll('.class-btn').forEach(button => {
                button.addEventListener('click', () => {
                    // Remove selected class from all buttons
                    document.querySelectorAll('.class-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    
                    // Add selected class to clicked button
                    button.classList.add('selected');
                    
                    // Set the selected class
                    this.selectedClass = button.dataset.class;
                    
                    // Reset ability usage for new class
                    this.usedAbilities = {
                        attacker: { nuke: false, annihilate: false },
                        defender: { counter: false, jam: false },
                        supporter: { hacker: false, moreHelp: false, scanner: false }
                    };
                    
                    // Update ability buttons
                    this.renderAbilityButtons();
                    
                    // Show notification
                    showNotification(`Selected ${this.selectedClass} class`);
                });
            });
        }

        initializeGame() {
            this.placeShips();
            this.renderGrid();
            this.updateStats();
            this.setupEventListeners();
            this.renderAbilityButtons();
        }
        
        // Render ability buttons based on selected class
        renderAbilityButtons() {
            const existingButtons = document.querySelector('.ability-buttons');
            if (existingButtons) {
                existingButtons.remove();
            }
            
            if (!this.selectedClass) return;
            
            const gameContainer = document.querySelector('.game-container');
            const abilityButtons = document.createElement('div');
            abilityButtons.classList.add('ability-buttons');
            
            let buttonsHTML = '<p>Class Abilities:</p><div class="abilities-row">';
            
            if (this.selectedClass === 'attacker') {
                buttonsHTML += `
                    <button class="btn ability-btn" data-ability="nuke" ${this.usedAbilities.attacker.nuke ? 'disabled' : ''}>
                        <i class="fas fa-bomb"></i> Nuke
                    </button>
                    <button class="btn ability-btn" data-ability="annihilate" ${this.usedAbilities.attacker.annihilate ? 'disabled' : ''}>
                        <i class="fas fa-skull-crossbones"></i> Annihilate
                    </button>
                `;
            } else if (this.selectedClass === 'defender') {
                buttonsHTML += `
                    <button class="btn ability-btn" data-ability="counter" ${this.usedAbilities.defender.counter ? 'disabled' : ''}>
                        <i class="fas fa-sync-alt"></i> Counter
                    </button>
                    <button class="btn ability-btn" data-ability="jam" ${this.usedAbilities.defender.jam ? 'disabled' : ''}>
                        <i class="fas fa-shield-alt"></i> Jam
                    </button>
                `;
            } else if (this.selectedClass === 'supporter') {
                buttonsHTML += `
                    <button class="btn ability-btn" data-ability="hacker" ${this.usedAbilities.supporter.hacker ? 'disabled' : ''}>
                        <i class="fas fa-laptop-code"></i> Hacker
                    </button>
                    <button class="btn ability-btn" data-ability="moreHelp" ${this.usedAbilities.supporter.moreHelp ? 'disabled' : ''}>
                        <i class="fas fa-plus-circle"></i> More Help
                    </button>
                    <button class="btn ability-btn" data-ability="scanner" ${this.usedAbilities.supporter.scanner ? 'disabled' : ''}>
                        <i class="fas fa-search"></i> Scanner
                    </button>
                `;
            }
            
            buttonsHTML += '</div>';
            abilityButtons.innerHTML = buttonsHTML;
            
            // Insert before reset button
            const resetButton = document.getElementById('resetGame');
            if (resetButton) {
                resetButton.before(abilityButtons);
            } else {
                gameContainer.appendChild(abilityButtons);
            }
            
            // Add event listeners
            document.querySelectorAll('.ability-btn').forEach(btn => {
                if (!btn.disabled) {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const ability = btn.dataset.ability;
                        if (ability) {
                            this.useAbility(ability);
                            showNotification(`Using ${ability} ability!`);
                        }
                    });
                }
            });
        }
        
        // Handle ability usage
        useAbility(ability) {
            switch(ability) {
                case 'nuke':
                    this.useNukeAbility();
                    this.usedAbilities.attacker.nuke = true;
                    break;
                case 'annihilate':
                    this.useAnnihilateAbility();
                    this.usedAbilities.attacker.annihilate = true;
                    break;
                case 'counter':
                    this.useCounterAbility();
                    this.usedAbilities.defender.counter = true;
                    break;
                case 'jam':
                    this.useJamAbility();
                    this.usedAbilities.defender.jam = true;
                    break;
                case 'hacker':
                    this.useHackerAbility();
                    this.usedAbilities.supporter.hacker = true;
                    break;
                case 'moreHelp':
                    this.useMoreHelpAbility();
                    this.usedAbilities.supporter.moreHelp = true;
                    break;
                case 'scanner':
                    this.useScannerAbility();
                    this.usedAbilities.supporter.scanner = true;
                    break;
            }
            this.renderAbilityButtons();
        }
        
        // Ability implementations
        useNukeAbility() {
            showNotification('NUKE: Click a target cell to attack in an X pattern');
            document.querySelectorAll('.game-cell:not(.revealed)').forEach(cell => {
                cell.classList.add('nuke-target');
            });
            
            const nukeHandler = (e) => {
                if (e.target.classList.contains('game-cell') && e.target.classList.contains('nuke-target')) {
                    const index = parseInt(e.target.dataset.index);
                    const x = index % this.gridSize;
                    const y = Math.floor(index / this.gridSize);
                    
                    // Define X pattern cells
                    const xCells = [
                        index, // Center
                        (x+1 < this.gridSize && y+1 < this.gridSize) ? index + this.gridSize + 1 : -1, // Bottom right
                        (x-1 >= 0 && y+1 < this.gridSize) ? index + this.gridSize - 1 : -1, // Bottom left
                        (x+1 < this.gridSize && y-1 >= 0) ? index - this.gridSize + 1 : -1, // Top right
                        (x-1 >= 0 && y-1 >= 0) ? index - this.gridSize - 1 : -1 // Top left
                    ];
                    
                    // Attack all cells in X pattern
                    xCells.forEach(cellIndex => {
                        if (cellIndex >= 0 && cellIndex < this.gridSize * this.gridSize) {
                            const cell = document.querySelector(`.game-cell[data-index="${cellIndex}"]`);
                            if (cell && !cell.classList.contains('revealed')) {
                                this.handleCellClick(cellIndex);
                            }
                        }
                    });
                    
                    // Remove event listener and targets
                    document.querySelector('.game-grid').removeEventListener('click', nukeHandler);
                    document.querySelectorAll('.nuke-target').forEach(cell => {
                        cell.classList.remove('nuke-target');
                    });
                }
            };
            
            document.querySelector('.game-grid').addEventListener('click', nukeHandler, { once: true });
        }
        
        useAnnihilateAbility() {
            showNotification('ANNIHILATE: Click a cell to attack in a straight line of 3 cells');
            document.querySelectorAll('.game-cell:not(.revealed)').forEach(cell => {
                cell.classList.add('annihilate-target');
            });
            
            const annihilateHandler = (e) => {
                if (e.target.classList.contains('game-cell') && e.target.classList.contains('annihilate-target')) {
                    const index = parseInt(e.target.dataset.index);
                    const x = index % this.gridSize;
                    const y = Math.floor(index / this.gridSize);
                    
                    // Define the 4 possible line directions
                    const directions = [
                        [1, 0],  // horizontal right
                        [-1, 0], // horizontal left
                        [0, 1],  // vertical down
                        [0, -1]  // vertical up
                    ];
                    
                    // Choose a random direction
                    const direction = directions[Math.floor(Math.random() * directions.length)];
                    const [dx, dy] = direction;
                    
                    // Get cells in that direction
                    const cellsToAttack = [];
                    cellsToAttack.push(index); // Start with the clicked cell
                    
                    // Add two more cells in the chosen direction
                    for (let i = 1; i <= 2; i++) {
                        const nx = x + (dx * i);
                        const ny = y + (dy * i);
                        
                        if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                            const nextIndex = nx + (ny * this.gridSize);
                            cellsToAttack.push(nextIndex);
                        }
                    }
                    
                    // Attack all cells in line
                    setTimeout(() => {
                        showNotification(`ANNIHILATE: Attacking a line of ${cellsToAttack.length} cells!`);
                        
                        const attackNextCell = (i) => {
                            if (i < cellsToAttack.length) {
                                const cellIndex = cellsToAttack[i];
                                const cell = document.querySelector(`.game-cell[data-index="${cellIndex}"]`);
                                
                                if (cell && !cell.classList.contains('revealed')) {
                                    this.handleCellClick(cellIndex);
                                }
                                
                                // Attack the next cell with a slight delay
                                setTimeout(() => attackNextCell(i + 1), 300);
                            }
                        };
                        
                        // Start attacking cells
                        attackNextCell(0);
                    }, 200);
                    
                    // Remove event listener and targets
                    document.querySelector('.game-grid').removeEventListener('click', annihilateHandler);
                    document.querySelectorAll('.annihilate-target').forEach(cell => {
                        cell.classList.remove('annihilate-target');
                    });
                }
            };
            
            document.querySelector('.game-grid').addEventListener('click', annihilateHandler, { once: true });
            this.usedAbilities.attacker.annihilate = true;
            this.renderAbilityButtons();
        }
        
        useCounterAbility() {
            this.counterActive = true;
            showNotification('COUNTER: Next time your ship is hit, you will automatically strike back');
        }
        
        useJamAbility() {
            this.jamActive = true;
            showNotification('JAM: Your next ship to be hit will be protected from damage');
        }
        
        useHackerAbility() {
            // Reveal one random ship segment
            if (this.shipLocations.size > 0) {
                const shipCells = Array.from(this.shipLocations);
                const randomShipIndex = shipCells[Math.floor(Math.random() * shipCells.length)];
                
                const cell = document.querySelector(`.game-cell[data-index="${randomShipIndex}"]`);
                if (cell) {
                    cell.style.backgroundColor = 'rgba(100, 255, 218, 0.3)';
                    setTimeout(() => {
                        if (!cell.classList.contains('revealed')) {
                            cell.style.backgroundColor = '';
                        }
                    }, 2000);
                }
                
                showNotification('HACKER: A ship segment has been temporarily revealed!');
            }
        }
        
        useMoreHelpAbility() {
            // Add a new small ship
            let placed = false;
            let attempts = 0;
            
            while (!placed && attempts < 100) {
                const horizontal = Math.random() < 0.5;
                const x = Math.floor(Math.random() * this.gridSize);
                const y = Math.floor(Math.random() * this.gridSize);
                
                if (this.canPlaceShip(x, y, 2, horizontal)) {
                    this.placeShip(x, y, 2, horizontal);
                    placed = true;
                    this.shipsRemaining++;
                    this.updateStats();
                    showNotification('MORE HELP: A new ship has been added to the grid!');
                }
                attempts++;
            }
            
            if (!placed) {
                showNotification('Could not place additional ship - grid too crowded');
            }
        }
        
        useScannerAbility() {
            showNotification('SCANNER: Click to scan a 4×4 area for ships');
            document.querySelectorAll('.game-cell:not(.revealed)').forEach(cell => {
                cell.classList.add('scanner-target');
            });
            
            const scannerHandler = (e) => {
                if (e.target.classList.contains('game-cell') && e.target.classList.contains('scanner-target')) {
                    const index = parseInt(e.target.dataset.index);
                    const x = index % this.gridSize;
                    const y = Math.floor(index / this.gridSize);
                    
                    // Define 4×4 area
                    let shipCount = 0;
                    for (let dy = -1; dy <= 2; dy++) {
                        for (let dx = -1; dx <= 2; dx++) {
                            const nx = x + dx;
                            const ny = y + dy;
                            if (nx >= 0 && nx < this.gridSize && ny >= 0 && ny < this.gridSize) {
                                const cellIndex = nx + (ny * this.gridSize);
                                const cellElement = document.querySelector(`.game-cell[data-index="${cellIndex}"]`);
                                
                                if (this.shipLocations.has(cellIndex)) {
                                    shipCount++;
                                    // Highlight scan area
                                    cellElement.classList.add('scanned');
                                } else if (cellElement) {
                                    cellElement.classList.add('scanned-empty');
                                }
                            }
                        }
                    }
                    
                    setTimeout(() => {
                        document.querySelectorAll('.scanned, .scanned-empty').forEach(cell => {
                            cell.classList.remove('scanned', 'scanned-empty');
                        });
                    }, 2000);
                    
                    showNotification(`SCANNER: Detected ${shipCount} ship segments in this area`);
                    
                    // Remove event listener and targets
                    document.querySelector('.game-grid').removeEventListener('click', scannerHandler);
                    document.querySelectorAll('.scanner-target').forEach(cell => {
                        cell.classList.remove('scanner-target');
                    });
                }
            };
            
            document.querySelector('.game-grid').addEventListener('click', scannerHandler, { once: true });
        }

        handleCellClick(index) {
            const cell = document.querySelector(`.game-cell[data-index="${index}"]`);
            if (!cell || cell.classList.contains('revealed')) return;

            if (!this.selectedClass) {
                showNotification('Please select a character class first!');
                return;
            }

            this.shots++;
            cell.classList.add('revealed');

            // Check if this is a hit
            if (this.shipLocations.has(Number(index))) {
                // Check if JAM ability is active
                if (this.jamActive) {
                    this.jamActive = false;
                    cell.classList.add('jammed');
                    showNotification('JAM: Your ship was protected from damage!');
                    this.updateStats();
                    return;
                }
                
                cell.classList.add('hit');
                this.hits++;
                this.shipLocations.delete(Number(index));
                
                // Check for COUNTER ability
                if (this.counterActive) {
                    this.counterActive = false;
                    // Find a random cell to counter-attack
                    const remainingCells = Array.from(document.querySelectorAll('.game-cell:not(.revealed)'))
                        .map(cell => parseInt(cell.dataset.index));
                    
                    if (remainingCells.length > 0) {
                        const randomIndex = remainingCells[Math.floor(Math.random() * remainingCells.length)];
                        setTimeout(() => {
                            showNotification('COUNTER: Automatic counter-attack triggered!');
                            this.handleCellClick(randomIndex);
                        }, 500);
                    }
                }
                
                // Check for ANNIHILATE ability
                if (this.annihilateActive) {
                    this.annihilateActive = false;
                    
                    const x = Number(index) % this.gridSize;
                    const y = Math.floor(Number(index) / this.gridSize);
                    
                    // Define adjacent cells
                    const adjacentCells = [
                        (x+1 < this.gridSize) ? index + 1 : -1, // Right
                        (x-1 >= 0) ? index - 1 : -1, // Left
                        (y+1 < this.gridSize) ? index + this.gridSize : -1, // Bottom
                        (y-1 >= 0) ? index - this.gridSize : -1 // Top
                    ].filter(idx => idx >= 0);
                    
                    // Select 2 random adjacent cells
                    if (adjacentCells.length > 0) {
                        adjacentCells.sort(() => Math.random() - 0.5);
                        const cellsToAttack = adjacentCells.slice(0, 2);
                        
                        setTimeout(() => {
                            showNotification('ANNIHILATE: Attacking 2 adjacent cells!');
                            cellsToAttack.forEach(idx => {
                                const cell = document.querySelector(`.game-cell[data-index="${idx}"]`);
                                if (cell && !cell.classList.contains('revealed')) {
                                    this.handleCellClick(idx);
                                }
                            });
                        }, 500);
                    }
                }
                
                if (this.shipLocations.size === 0) {
                    this.shipsRemaining = 0;
                    setTimeout(() => showNotification('Congratulations! You found all ships!'), 100);
                } else {
                    this.shipsRemaining = Math.ceil(this.shipLocations.size / 2);
                }
            } else {
                cell.classList.add('miss');
            }

            this.updateStats();
        }

        // Reset game
        resetGame() {
            this.hits = 0;
            this.shots = 0;
            this.shipsRemaining = this.ships.length;
            this.usedAbilities = {
                attacker: { nuke: false, annihilate: false },
                defender: { counter: false, jam: false },
                supporter: { hacker: false, moreHelp: false, scanner: false }
            };
            this.annihilateActive = false;
            this.counterActive = false;
            this.jamActive = false;
            this.placeShips();
            this.renderGrid();
            this.updateStats();
            this.renderAbilityButtons();
        }

        // Update event listeners to use resetGame method
        setupEventListeners() {
            const gameGrid = document.querySelector('.game-grid');
            if (!gameGrid) return;
            
            gameGrid.addEventListener('click', (e) => {
                if (!this.selectedClass) {
                    showNotification('Please select a character class first!');
                    return;
                }
                
                if (e.target.classList.contains('game-cell') && 
                    !e.target.classList.contains('nuke-target') && 
                    !e.target.classList.contains('scanner-target')) {
                    this.handleCellClick(e.target.dataset.index);
                }
            });

            const resetButton = document.getElementById('resetGame');
            if (resetButton) {
                resetButton.addEventListener('click', () => {
                    this.selectedClass = null;
                    document.querySelectorAll('.class-btn').forEach(btn => {
                        btn.classList.remove('selected');
                    });
                    this.resetGame();
                });
            }
        }

        placeShips() {
            this.shipLocations.clear();
            this.grid = Array(this.gridSize * this.gridSize).fill(null);
            
            // Create zones to distribute ships better
            const zones = [
                { startX: 0, startY: 0, endX: 3, endY: 3 },
                { startX: 4, startY: 0, endX: 7, endY: 3 },
                { startX: 0, startY: 4, endX: 3, endY: 7 },
                { startX: 4, startY: 4, endX: 7, endY: 7 }
            ];
            
            // Try to place at least one ship in each zone
            for (let i = 0; i < Math.min(this.ships.length, zones.length); i++) {
                const ship = this.ships[i];
                const zone = zones[i];
                
                let placed = false;
                let attempts = 0;
                
                while (!placed && attempts < 50) {
                    const horizontal = Math.random() < 0.5;
                    const x = Math.floor(Math.random() * (zone.endX - zone.startX + 1)) + zone.startX;
                    const y = Math.floor(Math.random() * (zone.endY - zone.startY + 1)) + zone.startY;
                    
                    if (this.canPlaceShip(x, y, ship.size, horizontal)) {
                        this.placeShip(x, y, ship.size, horizontal);
                        placed = true;
                    }
                    attempts++;
                }
                
                // If we couldn't place in zone, try anywhere
                if (!placed) {
                    attempts = 0;
                    while (!placed && attempts < 100) {
                        const horizontal = Math.random() < 0.5;
                        const x = Math.floor(Math.random() * this.gridSize);
                        const y = Math.floor(Math.random() * this.gridSize);
                        
                        if (this.canPlaceShip(x, y, ship.size, horizontal)) {
                            this.placeShip(x, y, ship.size, horizontal);
                            placed = true;
                        }
                        attempts++;
                    }
                }
            }
            
            // Place any remaining ships anywhere on the grid
            for (let i = zones.length; i < this.ships.length; i++) {
                const ship = this.ships[i];
                let placed = false;
                let attempts = 0;
                
                while (!placed && attempts < 100) {
                    const horizontal = Math.random() < 0.5;
                    const x = Math.floor(Math.random() * this.gridSize);
                    const y = Math.floor(Math.random() * this.gridSize);
                    
                    if (this.canPlaceShip(x, y, ship.size, horizontal)) {
                        this.placeShip(x, y, ship.size, horizontal);
                        placed = true;
                    }
                    attempts++;
                }
            }
        }

        canPlaceShip(x, y, size, horizontal) {
            if (horizontal && x + size > this.gridSize) return false;
            if (!horizontal && y + size > this.gridSize) return false;
            
            for (let i = 0; i < size; i++) {
                const pos = horizontal ? 
                    x + i + (y * this.gridSize) : 
                    x + ((y + i) * this.gridSize);
                
                if (this.grid[pos] !== null) return false;
            }
            return true;
        }

        placeShip(x, y, size, horizontal) {
            for (let i = 0; i < size; i++) {
                const pos = horizontal ? 
                    x + i + (y * this.gridSize) : 
                    x + ((y + i) * this.gridSize);
                this.grid[pos] = 'ship';
                this.shipLocations.add(pos);
            }
        }

        renderGrid() {
            const gameGrid = document.querySelector('.game-grid');
            if (!gameGrid) return;
            
            gameGrid.innerHTML = '';
            
            for (let y = 0; y < this.gridSize; y++) {
                for (let x = 0; x < this.gridSize; x++) {
                    const index = x + (y * this.gridSize);
                    const cell = document.createElement('div');
                    cell.classList.add('game-cell');
                    cell.dataset.index = index;
                    gameGrid.appendChild(cell);
                }
            }
        }

        updateStats() {
            const hitCount = document.getElementById('hitCount');
            const shotCount = document.getElementById('shotCount');
            const shipsRemaining = document.getElementById('shipsRemaining');
            
            if (hitCount) hitCount.textContent = this.hits;
            if (shotCount) shotCount.textContent = this.shots; // Fix: was using hitCount instead of shotCount
            if (shipsRemaining) shipsRemaining.textContent = this.shipsRemaining;
        }
    }

    // Initialize the game if the game container exists
    if (document.querySelector('.game-grid')) {
        new BattleshipGame();
    }
});

// Fix the game initialization by ensuring the game grid is populated
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the Battleship game
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        // Make sure game grid exists
        let gameGrid = document.querySelector('.game-grid');
        if (!gameGrid) {
            gameGrid = document.createElement('div');
            gameGrid.classList.add('game-grid');
            
            // Find where to insert it
            const gameStats = document.querySelector('.game-stats');
            if (gameStats) {
                gameStats.after(gameGrid);
            } else {
                gameContainer.appendChild(gameGrid);
            }
        }
        
        // Add game stats if missing
        if (!document.querySelector('.game-stats')) {
            const gameStats = document.createElement('div');
            gameStats.classList.add('game-stats');
            gameStats.innerHTML = `
                <p>Hits: <span id="hitCount">0</span></p>
                <p>Shots: <span id="shotCount">0</span></p>
                <p>Ships Remaining: <span id="shipsRemaining">5</span></p>
            `;
            gameContainer.prepend(gameStats);
        }
        
        // Add reset button if missing
        if (!document.getElementById('resetGame')) {
            const resetButton = document.createElement('button');
            resetButton.id = 'resetGame';
            resetButton.classList.add('btn');
            resetButton.textContent = 'New Game';
            gameContainer.appendChild(resetButton);
        }
        
        // Add a notification span to the game container
        if (gameContainer && !document.querySelector('.game-notification')) {
            const notification = document.createElement('div');
            notification.classList.add('game-notification');
            notification.innerHTML = '<span></span>';
            
            // Add after game stats
            const statsElement = document.querySelector('.game-stats');
            if (statsElement) {
                statsElement.after(notification);
            } else {
                gameContainer.prepend(notification);
            }
        }
        
        // Force initialization
        setTimeout(() => {
            new BattleshipGame();
            console.log("Game initialized");
        }, 100);
    }
});

// Replace alert with span notifications
function showNotification(message) {
    const notification = document.querySelector('.game-notification span');
    if (notification) {
        let icon = 'info-circle';
        
        if (message.includes('NUKE')) icon = 'bomb';
        else if (message.includes('ANNIHILATE')) icon = 'skull-crossbones';
        else if (message.includes('COUNTER')) icon = 'sync-alt';
        else if (message.includes('JAM')) icon = 'shield-alt';
        else if (message.includes('HACKER')) icon = 'laptop-code';
        else if (message.includes('SCANNER')) icon = 'search';
        else if (message.includes('MORE HELP')) icon = 'plus-circle';
        else if (message.includes('Congratulations')) icon = 'trophy';
        else if (message.includes('ship')) icon = 'ship';
        
        notification.innerHTML = `<i class="fas fa-${icon} notification-icon"></i>${message}`;
        notification.style.animation = 'none';
        setTimeout(() => {
            notification.style.animation = 'fadeIn 0.5s ease';
        }, 10);
    }
}