/*
    Muscle Recovery Tracker

    For now:
    - Clicking a muscle records today's workout.
    - The muscle changes color based on time since it was trained.
*/


// ------------------------------------
// Muscle names
// ------------------------------------

const muscleNames = {

    chest: "Chest",

    shoulders: "Shoulders",

    biceps: "Biceps",

    triceps: "Triceps",

    back: "Upper Back",

    lats: "Lats",

    core: "Core",

    quads: "Quads",

    hamstrings: "Hamstrings",

    glutes: "Glutes",

    calves: "Calves"

};


// ------------------------------------
// Stores the last time each muscle
// was trained.
// ------------------------------------

const muscleData = {};


// ------------------------------------
// Convert a muscle's age into a color
// ------------------------------------

function getMuscleColor(muscle) {

    // If we have never trained it,
    // make it red.

    if (!muscleData[muscle]) {

        return "#cf5555";

    }


    // How many days ago was it trained?

    const millisecondsPerDay =
        1000 * 60 * 60 * 24;

    const daysAgo =
        (Date.now() - muscleData[muscle])
        / millisecondsPerDay;


    // Recently trained

    if (daysAgo < 1) {

        return "#48a868";

    }


    // Starting to become due

    if (daysAgo < 2) {

        return "#d8b83f";

    }


    // Due

    if (daysAgo < 4) {

        return "#df843d";

    }


    // Overdue

    return "#cf5555";
}


// ------------------------------------
// Update every muscle's color
// ------------------------------------

function updateMuscleColors() {

    const muscles =
        document.querySelectorAll(".muscle");


    muscles.forEach(function (muscleElement) {

        const muscle =
            muscleElement.dataset.muscle;

        muscleElement.style.fill =
            getMuscleColor(muscle);

    });
}


// ------------------------------------
// Record a workout
// ------------------------------------

function trainMuscle(muscle) {

    // Record the current time.

    muscleData[muscle] = Date.now();


    // Update the colors.

    updateMuscleColors();


    // Update information panel.

    const info =
        document.getElementById("info");


    info.innerHTML = `

        <strong>${muscleNames[muscle]}</strong>

        <p>
            Last trained: today.
            This muscle is now green and will
            gradually move toward red over time.
        </p>

    `;
}


// ------------------------------------
// Give every muscle a click handler
// ------------------------------------

const muscles =
    document.querySelectorAll(".muscle");


muscles.forEach(function (muscleElement) {

    muscleElement.addEventListener(
        "click",
        function () {

            const muscle =
                muscleElement.dataset.muscle;

            trainMuscle(muscle);

        }
    );

});


// ------------------------------------
// Set initial colors
// ------------------------------------

updateMuscleColors();
