document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('screen-video');
    const videoContainer = document.getElementById('video-container');
    const placeholder = document.getElementById('video-placeholder');
    const btnStartShare = document.getElementById('btn-start-share');
    const btnStartCamera = document.getElementById('btn-start-camera');
    const btnScan = document.getElementById('btn-scan');
    const statusContainer = document.getElementById('status-container');
    const alignmentBox = document.getElementById('alignment-box');
    const gridOverlay = document.getElementById('grid-overlay');
    const canvas = document.getElementById('capture-canvas');
    const ctx = canvas.getContext('2d');

    const sudokuEngine = new Sudoku();

    // 1. Generate 81 Grid Cells
    for (let i = 0; i < 81; i++) {
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        cell.id = `cell-${i}`;
        gridOverlay.appendChild(cell);
    }

    function showStatus(msg, type='info') {
        statusContainer.textContent = msg;
        statusContainer.className = `message ${type}`;
        statusContainer.classList.remove('hidden');
    }

    function onVideoStarted(stream) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            placeholder.classList.add('hidden');
            alignmentBox.classList.remove('hidden');
            btnScan.classList.remove('hidden');
            btnStartShare.classList.add('hidden');
            btnStartCamera.classList.add('hidden');
            
            // Center alignment box initially
            const vcRect = videoContainer.getBoundingClientRect();
            let boxSize = Math.min(300, vcRect.width - 40, vcRect.height - 40);
            alignmentBox.style.width = `${boxSize}px`;
            alignmentBox.style.height = `${boxSize}px`;
            alignmentBox.style.left = `${(vcRect.width - boxSize) / 2}px`;
            alignmentBox.style.top = `${(vcRect.height - boxSize) / 2}px`;
        };

        stream.getVideoTracks()[0].onended = () => {
            placeholder.classList.remove('hidden');
            alignmentBox.classList.add('hidden');
            btnScan.classList.add('hidden');
            btnStartShare.classList.remove('hidden');
            btnStartCamera.classList.remove('hidden');
            video.srcObject = null;
        };
    }

    // 2. Input Setup (Screen Share & Screenshot Upload)
    const imageUpload = document.getElementById('image-upload');
    const screenImg = document.getElementById('screen-img');
    let isUsingImage = false;

    function showAlignmentBox(width, height) {
        placeholder.classList.add('hidden');
        alignmentBox.classList.remove('hidden');
        btnScan.classList.remove('hidden');
        btnStartShare.classList.add('hidden');
        imageUpload.parentElement.classList.add('hidden');
        
        // Center alignment box initially
        const vcRect = videoContainer.getBoundingClientRect();
        let boxSize = Math.min(300, vcRect.width - 40, vcRect.height - 40);
        alignmentBox.style.width = `${boxSize}px`;
        alignmentBox.style.height = `${boxSize}px`;
        alignmentBox.style.left = `${(vcRect.width - boxSize) / 2}px`;
        alignmentBox.style.top = `${(vcRect.height - boxSize) / 2}px`;
    }

    btnStartShare.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: { cursor: "never" }
            });
            isUsingImage = false;
            video.style.display = 'block';
            screenImg.style.display = 'none';
            video.srcObject = stream;
            
            video.onloadedmetadata = () => {
                showAlignmentBox(video.videoWidth, video.videoHeight);
            };

            stream.getVideoTracks()[0].onended = () => {
                placeholder.classList.remove('hidden');
                alignmentBox.classList.add('hidden');
                btnScan.classList.add('hidden');
                btnStartShare.classList.remove('hidden');
                imageUpload.parentElement.classList.remove('hidden');
                video.srcObject = null;
            };
        } catch (err) {
            console.error("Error: " + err);
            showStatus("Gagal membagikan layar.", "error");
        }
    });

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                isUsingImage = true;
                video.style.display = 'none';
                screenImg.style.display = 'block';
                screenImg.src = event.target.result;
                screenImg.onload = () => {
                    showAlignmentBox(screenImg.naturalWidth, screenImg.naturalHeight);
                };
            };
            reader.readAsDataURL(file);
        }
    });

    // 3. Draggable and Resizable Alignment Box
    let isDragging = false;
    let isResizing = false;
    let currentHandle = null;
    let startX, startY, startLeft, startTop, startWidth, startHeight;

    alignmentBox.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('resize-handle')) {
            isResizing = true;
            currentHandle = e.target.classList[1]; // top-left, etc.
        } else {
            isDragging = true;
        }
        startX = e.clientX;
        startY = e.clientY;
        startLeft = alignmentBox.offsetLeft;
        startTop = alignmentBox.offsetTop;
        startWidth = alignmentBox.offsetWidth;
        startHeight = alignmentBox.offsetHeight;
        e.preventDefault(); // prevent text selection
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging && !isResizing) return;

        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        if (isDragging) {
            alignmentBox.style.left = `${startLeft + dx}px`;
            alignmentBox.style.top = `${startTop + dy}px`;
        } else if (isResizing) {
            // Calculate new bounds based on handle
            if (currentHandle.includes('right')) {
                alignmentBox.style.width = `${startWidth + dx}px`;
            }
            if (currentHandle.includes('left')) {
                alignmentBox.style.width = `${startWidth - dx}px`;
                alignmentBox.style.left = `${startLeft + dx}px`;
            }
            if (currentHandle.includes('bottom')) {
                alignmentBox.style.height = `${startHeight + dy}px`;
            }
            if (currentHandle.includes('top')) {
                alignmentBox.style.height = `${startHeight - dy}px`;
                alignmentBox.style.top = `${startTop + dy}px`;
            }
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        isResizing = false;
        currentHandle = null;
    });

    // 4. OCR and Solve Logic
    btnScan.addEventListener('click', async () => {
        const sourceElement = isUsingImage ? screenImg : video;
        const sourceWidth = isUsingImage ? sourceElement.naturalWidth : sourceElement.videoWidth;
        const sourceHeight = isUsingImage ? sourceElement.naturalHeight : sourceElement.videoHeight;
        
        if (!sourceWidth) return;

        showStatus("Mendeteksi angka... Mohon tunggu (membutuhkan waktu beberapa detik).", "info");
        btnScan.disabled = true;
        
        // Clear previous results
        for(let i = 0; i < 81; i++) document.getElementById(`cell-${i}`).textContent = '';

        // Calculate proportions of the alignment box relative to the actual dimensions
        const containerRect = sourceElement.getBoundingClientRect();
        const boxRect = alignmentBox.getBoundingClientRect();
        
        // Handle letterboxing/pillarboxing inside the container
        const sourceRatio = sourceWidth / sourceHeight;
        const containerRatio = containerRect.width / containerRect.height;
        
        let renderedWidth = containerRect.width;
        let renderedHeight = containerRect.height;
        let offsetX = 0;
        let offsetY = 0;

        if (sourceRatio > containerRatio) {
            renderedHeight = containerRect.width / sourceRatio;
            offsetY = (containerRect.height - renderedHeight) / 2;
        } else {
            renderedWidth = containerRect.height * sourceRatio;
            offsetX = (containerRect.width - renderedWidth) / 2;
        }

        const scaleX = sourceWidth / renderedWidth;
        const scaleY = sourceHeight / renderedHeight;

        // Map CSS coordinates to actual video pixels
        const cropX = (boxRect.left - containerRect.left - offsetX) * scaleX;
        const cropY = (boxRect.top - containerRect.top - offsetY) * scaleY;
        const cropW = boxRect.width * scaleX;
        const cropH = boxRect.height * scaleY;

        // Draw cropped area to canvas
        canvas.width = cropW;
        canvas.height = cropH;
        ctx.drawImage(sourceElement, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

        // Preprocess: Grayscale and contrast for better OCR
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            let avg = (data[i] + data[i+1] + data[i+2]) / 3;
            // High contrast threshold
            let val = avg < 128 ? 0 : 255; 
            data[i] = data[i+1] = data[i+2] = val;
        }
        ctx.putImageData(imageData, 0, 0);

        // Read all 81 cells
        const cellW = cropW / 9;
        const cellH = cropH / 9;
        
        const board = Array.from({length: 9}, () => Array(9).fill(0));
        
        // Initialize Tesseract Worker
        const worker = await Tesseract.createWorker('eng');
        await worker.setParameters({
            tessedit_char_whitelist: '123456789',
        });

        // Optimization: instead of 81 separate OCR calls, we could run it on the whole grid
        // But cell by cell gives better positional certainty.
        
        // We shrink the cell boundaries slightly to avoid reading the grid lines
        const margin = 0.15; // 15% margin
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cx = col * cellW + (cellW * margin);
                const cy = row * cellH + (cellH * margin);
                const cw = cellW * (1 - margin * 2);
                const ch = cellH * (1 - margin * 2);

                const rect = { left: cx, top: cy, width: cw, height: ch };
                
                // For efficiency, we should check if the cell is completely empty (all white)
                const cellData = ctx.getImageData(cx, cy, cw, ch).data;
                let blackPixels = 0;
                for(let i=0; i<cellData.length; i+=4) {
                    if (cellData[i] < 100) blackPixels++;
                }
                
                // If there are very few black pixels, it's an empty cell
                if (blackPixels < (cw * ch * 0.02)) {
                    board[row][col] = 0;
                    continue;
                }

                // OCR the specific cell
                const { data: { text } } = await worker.recognize(canvas, { rectangle: rect });
                let num = parseInt(text.replace(/[^1-9]/g, ''));
                if (num >= 1 && num <= 9) {
                    board[row][col] = num;
                    // Optional: show the detected number early
                    // document.getElementById(`cell-${row*9 + col}`).textContent = num;
                } else {
                    board[row][col] = 0;
                }
            }
        }
        
        await worker.terminate();

        // Feed to solver
        let boardCopy = board.map(row => [...row]);
        const isSolvable = sudokuEngine.solve(boardCopy);

        if (isSolvable) {
            // Render solution
            for (let row = 0; row < 9; row++) {
                for (let col = 0; col < 9; col++) {
                    const el = document.getElementById(`cell-${row*9 + col}`);
                    if (board[row][col] === 0) {
                        // It was empty, show the solved number
                        el.textContent = boardCopy[row][col];
                        el.style.color = '#10b981'; // Green
                    } else {
                        // Original number
                        el.textContent = board[row][col];
                        el.style.color = 'rgba(255,255,255,0.5)';
                    }
                }
            }
            showStatus("Sudoku berhasil dipecahkan!", "success");
        } else {
            showStatus("Gagal memecahkan Sudoku. Pastikan grid pas dengan angkanya.", "error");
        }
        
        btnScan.disabled = false;
    });

});
