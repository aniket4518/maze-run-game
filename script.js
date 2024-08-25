   let scene, camera, renderer;
    let player, exitGate;
    let walls = [];
    let maze;
    let cameraOffset = new THREE.Vector3(0, 5, 0);

    // Initialize Scene, Camera, and Renderer
    function init() {
        scene = new THREE.Scene();
        camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0xffffff, 1); // Set background color to white
        document.body.appendChild(renderer.domElement);

        // Lighting
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(0, 50, 50).normalize();
        scene.add(light);

        generateMaze(21, 15);
        createPlayer();
        createExitGate();
        camera.position.copy(player.position).add(cameraOffset);
        camera.lookAt(player.position);

        animate();
    }

    // Generate a Maze (Recursive Backtracking)
    function generateMaze(width, height) {
        maze = Array.from({ length: height }, () => Array(width).fill(1));

        function carve(x, y) {
            const directions = [
                [-2, 0], [2, 0], [0, -2], [0, 2]
            ];
            directions.sort(() => Math.random() - 0.5); // Shuffle directions

            directions.forEach(([dx, dy]) => {
                const nx = x + dx;
                const ny = y + dy;
                if (nx > 0 && ny > 0 && nx < width && ny < height && maze[ny][nx] === 1) {
                    maze[y + dy / 2][x + dx / 2] = 0;
                    maze[ny][nx] = 0;
                    carve(nx, ny);
                }
            });
        }

        maze[1][1] = 0; // Start point
        carve(1, 1);

        // Render Maze
        walls = [];
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const wallSize = 1;

        maze.forEach((row, i) => {
            row.forEach((cell, j) => {
                if (cell === 1) {
                    const wall = new THREE.Mesh(new THREE.BoxGeometry(wallSize, wallSize, wallSize), wallMaterial);
                    wall.position.set(j * wallSize - (maze[0].length * wallSize) / 2, wallSize / 2, i * wallSize - (maze.length * wallSize) / 2);
                    scene.add(wall);
                    walls.push(wall);
                }
            });
        });
    }

    // Create Player
    function createPlayer() {
        player = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        player.position.set(-maze[0].length * 0.5 + 1, 0.25, -maze.length * 0.5 + 1);
        scene.add(player);
    }

    // Create Exit Gate
    function createExitGate() {
        const gateMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        exitGate = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), gateMaterial);
        exitGate.position.set(maze[0].length * 0.5 - 2, 0.5, maze.length * 0.5 - 2);
        scene.add(exitGate);
    }

    // Check for Collision with Walls
    function checkCollision(newPosition) {
        const playerBox = new THREE.Box3().setFromObject(player);
        playerBox.translate(newPosition.clone().sub(player.position));

        for (let i = 0; i < walls.length; i++) {
            const wallBox = new THREE.Box3().setFromObject(walls[i]);
            if (playerBox.intersectsBox(wallBox)) {
                return true; // Collision detected
            }
        }
        return false; // No collision
    }

    // Check if Player Reached Exit
    function checkWin() {
        const playerBox = new THREE.Box3().setFromObject(player);
        const gateBox = new THREE.Box3().setFromObject(exitGate);

        return playerBox.intersectsBox(gateBox);
    }

    // Player Movement
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        const moveDistance = 0.2;
        const newPosition = player.position.clone();

        switch (key) {
            case 'ArrowUp':
            case 'w':
                newPosition.z -= moveDistance;
                break;
            case 'ArrowDown':
            case 's':
                newPosition.z += moveDistance;
                break;
            case 'ArrowLeft':
            case 'a':
                newPosition.x -= moveDistance;
                break;
            case 'ArrowRight':
            case 'd':
                newPosition.x += moveDistance;
                break;
        }

        if (!checkCollision(newPosition)) {
            player.position.copy(newPosition);
            if (checkWin()) {
                showWinMessage();
            }
        }
    });

    // Show Win Message
    function showWinMessage() {
        document.getElementById('message').textContent = 'You Win!';
        document.getElementById('startButton').classList.add('hidden');
        document.getElementById('restartButton').classList.remove('hidden');
        document.getElementById('overlay').classList.remove('hidden');
    }

    // Start Game
    function startGame() {
        document.getElementById('overlay').classList.add('hidden');
        init();
    }

    // Restart Game
    function restartGame() {
        // Clear the scene
        while (scene.children.length > 0) {
            scene.remove(scene.children[0]);
        }

        startGame();
    }

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        camera.position.copy(player.position).add(cameraOffset);
        camera.lookAt(player.position);

        renderer.render(scene, camera);
    }

    // Event Listeners for Start and Restart Buttons
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('restartButton').addEventListener('click', restartGame);

    // Initial Setup
    window.onload = function() {
        document.getElementById('restartButton').classList.add('hidden');
        document.getElementById('overlay').classList.remove('hidden');
    }
