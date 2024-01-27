// "use strict";

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputCadence = document.querySelector(".form__input--cadence");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords; // [lat,lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }
}

class Running extends Workout {
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  constructor(coords, distance, duration, elevetionGain) {
    super(coords, distance, duration);
    this.elevetionGain = elevetionGain;
    this.calcSpeed();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

const run = new Running([39, -12], 5.2, 24, 178);
const cycle = new Cycling([39, -12], 27, 95, 523);

class App {
  #map;
  #mapEvent;
  #workout = [];
  constructor() {
    this._getPosition();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Can not get your current Position");
        }
      );
  }

  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    var coords = [latitude, longitude];

    this.#map = L.map("map").setView(coords, 13);

    L.tileLayer("https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on("click", this._showForm.bind(this));
  }

  _showForm(mapEv) {
    this.#mapEvent = mapEv;
    form.classList.remove("hidden");
    inputDistance.focus();
  }

  _toggleElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    e.preventDefault();

    const validateInput = (...inputs) =>
      inputs.every((input) => Number.isFinite(input) && input >= 0);

    // Get data from form

    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    // if workout running, create running object
    if (type === "running") {
      const cadence = +inputCadence.value;
      // Check if is valid
      if (!validateInput(cadence, distance, duration))
        return alert("The input number must be positive");
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    // if workout cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      if (!validateInput(elevation, distance, duration))
        return alert("The input number must be positive");
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    
    // Add new object to workout array
    this.#workout.push(workout)
    console.log(this.#workout);
    // Render workout on map as marker

    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className:
            inputType.value === "running" ? "running-popup" : "cycling-popup",
        })
      )
      .setPopupContent(
        inputType.value === "running"
          ? "🏃‍♂️  " + inputType.value
          : "🚴‍♀️ " + inputType.value
      )
      .openPopup();
    // Render workout on list
    // Hide and clear input fields

    inputCadence.value =
      inputDistance.value =
      inputElevation.value =
      inputDuration.value =
        "";
    form.classList.add("hidden");

  }
}

const app = new App();
