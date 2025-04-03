import {Stats} from "../stats.js";

// Constants
const BAR_HEIGHT = 50;
const UPDATE_INTERVAL = 2000; // 2 seconds

// Global Variables
let stats;
let isPlaying = true;
let currentDayIndex = 0;
let totalPlaytime = 0;
let startY;
let artistColors = {
    "Iskender": "blue",
    "Enol": "green",
    "Lluc": "red",
    "FLETCHER": "orange",
    "Taylor Swift": "purple"
};
let cumulativeData = {};
let canvas, context, animationId;
let selectedDataType = "artists";
const colorPalette = [
    "#FF5733", // Color 1
    "#33FF57", // Color 2
    "#3357FF", // Color 3
    "#FF33A1", // Color 4
    "#A1FF33", // Color 5
    "#33FFF0", // Color 6
    "#F0FF33", // Color 7
    "#FF9033", // Color 8
    "#33FF90", // Color 9
    "#9033FF"  // Color 10
];

document.getElementById('playPauseBtn').addEventListener('click', togglePlayPause);
document.getElementById('downloadBtn').addEventListener('click', downloadCanvas);
window.addEventListener('dragover', handleDragOver);
window.addEventListener('dragleave', handleDragLeave);
window.addEventListener('drop', handleDrop);

export function handleClick(user) {
    alert("site under construction! something may not work as expected");
    removeUIElements();
    init(`../data/StreamingHistory${user}.json`);
}

function handleDropData(event) {
    event.preventDefault();
    removeUIElements();

    const file = event.dataTransfer.files[0];
    if (file) {
        const fileURL = URL.createObjectURL(file);
        init(fileURL);
    }
}

// Function to handle data type change
export function handleDataTypeChange(event) {
    selectedDataType = event.target.value;
}

function removeUIElements() {
    document.getElementById("button-container").remove();
    document.getElementById("msg").remove();
    document.getElementById("drop-zone").remove();
    document.getElementById("radio-container").remove();
}

function init(statsPath) {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    
    // Set initial canvas size
    const setCanvasSize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };

    function handleResize() {
        setCanvasSize(); // Set the new canvas size
        redrawChart(); // Re-draw the content
    }

    // Attach the handleResize function to the window resize event
    window.addEventListener("resize", handleResize);
    setCanvasSize();

    stats = new Stats( statsPath , () => {
        totalPlaytime = selectedDataType === "artists" ? stats.totalPlaytimeTopArtist : stats.totalPlaytimeTopTrack;
        draw();
    });

    // Function to update cumulative data and draw the chart
    function updateChart(dayData) {
        // Update cumulative playtime for each artist
        dayData.forEach( item => {
            // const name = selectedDataType === "artists" ? item.artistName : item.trackName;
            const name = item.name;
            cumulativeData[name] = (cumulativeData[name] || 0) + item.msPlayed;

            // if (!artistColors[name]) {
            //     artistColors[name] = getRandomColor(); // If the artist is new, assign a random color
            // }
        });

        // Sort artists by cumulative playtime and get the top 10
        const topItems = Object.entries(cumulativeData)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        // Create a color map for the top 10 items
        const colorMap = {};
        topItems.forEach(([name], index) => {
            colorMap[name] = colorPalette[index % colorPalette.length];
        });

        const totalHeight = topItems.length * (BAR_HEIGHT + 10); // Calculate the total height of the chart
        startY = (canvas.height - totalHeight) / 2 + 30; // Calculate the starting y-coordinate to center the chart vertically

        // Draw the chart
        context.clearRect(0, 0, canvas.width, canvas.height);
               
        // Draw the horizontal axis line
        const axisY = startY + totalHeight + 10;
        context.beginPath();
        context.moveTo(20, axisY);
        context.lineTo(canvas.width - 30, axisY);
        context.stroke();

        // Label the axis with the total milliseconds played
        context.font = '14px Verdana';
        context.fillStyle = '#000';
        context.fillText('Total Playtime (min)', canvas.width - 150, axisY + 20);
        
        topItems.forEach(([name, cumulativeMsPlayed], index) => {
            const relativePlaytime = cumulativeMsPlayed / totalPlaytime;
            const barWidth = relativePlaytime * (canvas.width - 150); // Adjust as needed
            const x = 20;
            const y = startY + index * (BAR_HEIGHT + 10);

            // Draw the rectangle with the artist's specific color
            context.fillStyle = colorMap[name] || '#000000'; // Default to gold if no specific color is defined
            context.fillRect(x, y, barWidth, BAR_HEIGHT);

            // Draw the artist name to the right of the bar with Y2K style
            context.font = '16px Verdana';
            context.fillStyle = '#000000';
            context.fillText(name, barWidth + 30, y + BAR_HEIGHT / 2);
            context.font = '10px Verdana';
            context.fillText(Math.floor(cumulativeMsPlayed / 60000), barWidth + 30, y + BAR_HEIGHT / 2 + 10);
        });
    } // end of updateChart function
        
    function draw() {
        if (isPlaying) {
            const days = Object.keys(stats.topForDay[selectedDataType]);

            if (currentDayIndex >= 0 && currentDayIndex < days.length) {
                const dayData = stats.topForDay[selectedDataType][days[currentDayIndex]];
                updateChart(dayData);
                
                // Draw the date with a Y2K aesthetic
                context.font = 'bold 28px Verdana'; // Bold and large font size
                context.fillStyle = '#000000'; // Gold color
                context.fillText(days[currentDayIndex], 20, startY - 30);

                currentDayIndex++; // Move to the next day
            } else {
                // Draw the date for the end of data
                context.font = 'bold 28px Verdana';
                context.fillStyle = '#000000';
                context.fillText("Your Top 10 For The Last Year!", 250, startY - 30);

                // If we reached the end of data, stop the animation
                isPlaying = false;
                document.getElementById('playPauseBtn').innerHTML = "Play";
                document.getElementById('playPauseBtn').style.visibility = "hidden";
                document.getElementById('downloadBtn').style.visibility = "visible";
            }

            // Continue the animation loop
            animationId = requestAnimationFrame(draw);
        }
    }
   
    document.getElementById('playPauseBtn').style.visibility = "visible";
    
    
}

function togglePlayPause() {
        isPlaying = !isPlaying;
        document.getElementById('playPauseBtn').innerHTML = isPlaying ? "Pause" : "Play";
        
        if (isPlaying) {
            draw(); // Start the animation
        } else {
            cancelAnimationFrame(animationId); // Stop the animation
        }
    }

// Function to generate a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function downloadCanvas() {
    const dataURL = canvas.toDataURL(); // Convert canvas content to data URL
    const downloadLink = document.createElement('a'); // Create a temporary link element
    downloadLink.href = dataURL;
    downloadLink.download = 'toodi.png'; // Set a default filename
    downloadLink.click(); // Trigger a click on the link to start the download
}

// Drop File
function handleDragOver(event) {
    event.preventDefault();
    document.getElementById('drop-zone').classList.add('dragover');
}

function handleDragLeave() {
    document.getElementById('drop-zone').classList.remove('dragover');
};

function handleDrop(event) {
    event.preventDefault();
    document.getElementById('drop-zone').classList.remove('dragover');
    handleDropData(event);
}
