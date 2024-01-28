// "use strict";
// prettier-ignore
const months = ["January","February","March","April","May","June","July","August","September","October","November","December",];

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

class App {
  #map;
  #mapEvent;
  #workout = [];
  constructor() {
    this._getPosition();
    // get data from local storage
    this._getLocalStorage();
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggleElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
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

    this.#map = L.map("map").setView(coords, 16);

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
    this.#workout.push(workout);
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
          ? "🏃‍♂️  " +
              `Running on ${
                months[workout.date.getMonth()]
              } ${workout.date.getDate()}`
          : "🚴‍♀️ " +
              `Cycling on ${
                months[workout.date.getMonth()]
              } ${workout.date.getDate()}`
      )
      .openPopup();
    // Render workout on list
    this._renderWorkout(workout);

    // set all workouts to local storage

    this._setWorkoutsToLocalStorage();
    // Hide and clear input fields

    inputCadence.value =
      inputDistance.value =
      inputElevation.value =
      inputDuration.value =
        "";
    form.classList.add("hidden");
  }

  _renderWorkout(workout) {
    let html = `
    <li class="workout workout--${
      workout.cadence > 0 ? "running" : "cycling"
    }" data-id="${workout.id}">
        <h2 class="workout__title">${
          workout.cadence > 0 ? "Running" : "Cycling"
        } on </h2>
        <div class="workout__details">
          <span class="workout__icon">🏃‍♂️</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.cadence > 0 ? "⚡️" : "🦶🏼"
          }</span>
          <span class="workout__value">${
            workout.cadence > 0
              ? workout.pace.toFixed(1)
              : workout.speed.toFixed(1)
          }</span>
          <span class="workout__unit">${
            workout.cadence > 0 ? "min/km" : "spm"
          }</span>
        </div>
      </li>
  `;

    return form.insertAdjacentHTML("afterend", html);
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    if (!workoutEl) return;
    const workout = this.#workout.find(
      (work) => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 16, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }
  // set localstorage to all workouts
  _setWorkoutsToLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));
    if (!data) return;
    this.#workout = data;
    this.#workout.forEach((work) => this._renderWorkout(work));
  }

  // reset local storage
  reset() {
    localStorage.removeItem("workouts");
    location.reload();
  }
}

const app = new App();
