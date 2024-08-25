  let scene, camera, renderer;
        let player, exitGate;
        let walls = [];
        let maze;
        const cameraOffset = new THREE.Vector3(0, 5,1);

        // Initialize the game scene
        function init() {
            // Create Scene
            scene = new THREE.Scene();

            // Set up Camera
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

            // Set up Renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setClearColor(0xffffff, 1); // White background
            document.body.appendChild(renderer.domElement);

            // Add Lighting
            const light = new THREE.DirectionalLight(0xffffff, 1);
            light.position.set(0, 50, 50).normalize();
            scene.add(light);

            // Generate and Render Maze
            generateMaze(21, 15);

            // Create Player and Exit Gate
            createPlayer();
            createExitGate();

            // Position Camera
            camera.position.copy(player.position).add(cameraOffset);
            camera.lookAt(player.position);

            // Start Animation Loop
            animate();
        }

        // Generate Maze using Recursive Backtracking
        function generateMaze(width, height) {
            // Initialize Maze Grid: 1 = Wall, 0 = Path
            maze = Array.from({ length: height }, () => Array(width).fill(1));

            // Recursive Function to Carve Paths
            function carve(x, y) {
                const directions = [
                    [-2, 0], [2, 0], [0, -2], [0, 2]
                ];
                // Shuffle Directions to Ensure Randomness
                directions.sort(() => Math.random() - 0.5);

                directions.forEach(([dx, dy]) => {
                    const nx = x + dx;
                    const ny = y + dy;
                    // Check Bounds and If the Cell is a Wall
                    if (nx > 0 && ny > 0 && nx < width && ny < height && maze[ny][nx] === 1) {
                        maze[y + dy / 2][x + dx / 2] = 0; // Remove Wall Between
                        maze[ny][nx] = 0; // Carve Path
                        carve(nx, ny); // Recursively Carve from New Position
                    }
                });
            }

            // Starting Point
            maze[1][1] = 0;
            carve(1, 1);

            // Render Maze Walls
            walls = [];
            const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 }); // Green Walls
            const wallSize = 1;

            maze.forEach((row, i) => {
                row.forEach((cell, j) => {
                    if (cell === 1) {
                        const wall = new THREE.Mesh(new THREE.BoxGeometry(wallSize, wallSize, wallSize), wallMaterial);
                        wall.position.set(
                            j * wallSize - (width * wallSize) / 2 + wallSize / 2,
                            wallSize / 2,
                            i * wallSize - (height * wallSize) / 2 + wallSize / 2
                        );
                        scene.add(wall);
                        walls.push(wall);
                    }
                });
            });
        }

        // Create Player
        function createPlayer() {
            const playerGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red Player
            player = new THREE.Mesh(playerGeometry, playerMaterial);
            player.position.set(- (maze[0].length / 2 - 1) * 1, 0.25, - (maze.length / 2 - 1) * 1);
            scene.add(player);
        }

        // Create Exit Gate
        function createExitGate() {
            const gateGeometry = new THREE.BoxGeometry(1, 1, 1);
            const gateMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue Exit Gate
            exitGate = new THREE.Mesh(gateGeometry, gateMaterial);
            exitGate.position.set(
                (maze[0].length / 2 - 1) * 1,
                0.5,
                (maze.length / 2 - 1) * 1
            );
            scene.add(exitGate);
        }

        // Check for Collision with Walls
        function checkCollision(newPosition) {
            const playerBox = new THREE.Box3().setFromObject(player);
            const delta = new THREE.Vector3().subVectors(newPosition, player.position);
            playerBox.translate(delta);

            for (let wall of walls) {
                const wallBox = new THREE.Box3().setFromObject(wall);
                if (playerBox.intersectsBox(wallBox)) {
                    return true; // Collision Detected
                }
            }
            return false; // No Collision
        }

        // Check if Player Reached Exit Gate
        function checkWin() {
            const playerBox = new THREE.Box3().setFromObject(player);
            const gateBox = new THREE.Box3().setFromObject(exitGate);
            return playerBox.intersectsBox(gateBox);
        }

        // Handle Player Movement
        function handleMovement(event) {
            const key = event.key.toLowerCase();
            const moveDistance = 0.2;
            let newPosition = player.position.clone();

            switch (key) {
                case 'arrowup':
                case 'w':
                    newPosition.z -= moveDistance;
                    break;
                case 'arrowdown':
                case 's':
                    newPosition.z += moveDistance;
                    break;
                case 'arrowleft':
                case 'a':
                    newPosition.x -= moveDistance;
                    break;
                case 'arrowright':
                case 'd':
                    newPosition.x += moveDistance;
                    break;
                default:
                    return; // Ignore other keys
            }

            if (!checkCollision(newPosition)) {
                player.position.copy(newPosition);
                // Check for Win Condition
                if (checkWin()) {
                    showWinPopup();
                }
            }
        }

        // Show Win Popup
        function showWinPopup() {
            const overlay = document.getElementById('overlay');
            const message = document.getElementById('message');
            const startButton = document.getElementById('startButton');
            const restartButton = document.createElement('button');

            // Update Overlay Content
            message.textContent = 'You Win!';
            startButton.style.display = 'none';

            // Create and Configure Restart Button
            restartButton.id = 'restartButton';
            restartButton.textContent = 'Restart Game';
            restartButton.style.display = 'block';
            restartButton.style.padding = '10px 20px';
            restartButton.style.fontSize = '1em';
            restartButton.style.marginTop = '20px';
            restartButton.style.cursor = 'pointer';
            restartButton.style.border = 'none';
            restartButton.style.borderRadius = '5px';
            restartButton.style.backgroundColor = '#007bff'; // Blue color

            // Append Restart Button to Overlay
            overlay.appendChild(restartButton);

            // Show Overlay
            overlay.classList.remove('hidden');

            // Add Click Event to Restart Button
            restartButton.addEventListener('click', () => {
                location.reload(); // Reload the Page to Restart the Game
            });
        }

        // Start the Game (Hide Overlay and Initialize)
        function startGame() {
            const overlay = document.getElementById('overlay');
            const startButton = document.getElementById('startButton');

            // Hide Overlay
            overlay.classList.add('hidden');

            // Remove Start Button Click Listener to Prevent Multiple Initializations
            startButton.removeEventListener('click', startGame);

            // Initialize the Game
            init();
        }

        // Animation Loop
        function animate() {
            requestAnimationFrame(animate);

            // Update Camera Position to Follow Player
            camera.position.copy(player.position).add(cameraOffset);
            camera.lookAt(player.position);

            renderer.render(scene, camera);
        }
 // Event Listeners
        document.addEventListener('keydown', handleMovement);
        document.getElementById('startButton').addEventListener('click', startGame);

        // Initial Setup on Page Load
        window.onload = function() {
            const overlay = document.getElementById('overlay');
            const startButton = document.getElementById('startButton');

            // Show Overlay with "Find the Exit!" Message and "Start Game" Button
            overlay.classList.remove('hidden');
            startButton.style.display = 'block';
        };
