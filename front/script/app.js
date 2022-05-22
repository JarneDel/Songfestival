'use strict';

const backend_IP = `http://${window.location.hostname}:5000`;
const backend = backend_IP + '/api/v1';
const lanIP = `${window.location.hostname}:5000`;
let socketio;
try {
  socketio = io(lanIP);
} catch {
  console.log('geen socketio');
}
const re =
  /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/)([\w\-\_]*)(&(amp;)?‌​[\w\?‌​=]*)?/;
let currentliedje;
// #region ***  DOM references                           ***********
let htmlCount,
  htmlKlaar,
  HTMLaantalRatings,
  htmlGetResult,
  HTMLAverage,
  htmlnext,
  htmltitel,
  htmlArtiest,
  htmlyoutube,
  htmlForm;

let StudentRatingID, aantalInzendingen;

// #endregion

// #region errorhandeling
const ShowError = function (string) {
  document.querySelector('.js-error').innerHTML = string;
};
const callbackError = function (jsonObject) {
  console.log('error');
  console.log(jsonObject);
};
// #endregion

// #region *** Student ***
const init_student = function () {
  console.log('input');
  listenToSocketstudent();
};

const ShowWait = function (jsonElement) {
  console.log(jsonElement);
  if (jsonElement.LiedjeID) {
    document.querySelector('.js-student').classList.add('c-is-hidden');
    document.querySelector('.js-wait').classList.remove('c-is-hidden');
    StudentRatingID = jsonElement.liedjeID;
  } else {
    document.querySelector('.js-input__error').innerhtml =
      'Error, probeer opnieuw';
  }
};

const listenToSocketstudent = function () {
  socketio.on('connect', function () {
    console.log('Verboden met webserver');
    socketio.emit('F2BAuth', { type: 'student' });
  });
  socketio.on('B2F_user_status', function (msg) {
    if (msg.status == -1) {
      document
        .querySelector('.js-wachten-op-start')
        .classList.remove('c-is-hidden');
      document.querySelector('.js-student').classList.add('c-is-hidden');
      document.querySelector('.js-wait').classList.add('c-is-hidden');
      document.querySelector('.js-rate').classList.add('c-is-hidden');
    }
    if (msg.status == 0) {
      document
        .querySelector('.js-wachten-op-start')
        .classList.add('c-is-hidden');
      document.querySelector('.js-student').classList.remove('c-is-hidden');
      document.querySelector('.js-wait').classList.add('c-is-hidden');
      document.querySelector('.js-rate').classList.add('c-is-hidden');
      listenTosubmitBtn();
    } else if (msg.status == 1) {
      document
        .querySelector('.js-wachten-op-start')
        .classList.add('c-is-hidden');
      document.querySelector('.js-student').classList.add('c-is-hidden');
      document.querySelector('.js-wait').classList.add('c-is-hidden');
      document.querySelector('.js-rate').classList.remove('c-is-hidden');
      htmlArtiest = document.querySelector('.js-artiest');
      htmltitel = document.querySelector('.js-titel');
      htmlForm = document.querySelector('.js-form');
      listenToVersturen();
    } else if (msg.status == 2) {
      document
        .querySelector('.js-wachten-op-start')
        .classList.add('c-is-hidden');
      document.querySelector('.js-student').classList.add('c-is-hidden');
      document.querySelector('.js-wait').classList.add('c-is-hidden');
      document.querySelector('.js-rate').classList.add('c-is-hidden');
      document
        .querySelector('.js-summary-student')
        .classList.remove('c-is-hidden');
    }
  });

  socketio.on('B2F_Rate', function (lied) {
    console.log('raten maar');
    htmlForm.classList.remove('c-is-hidden');
    document.querySelector('.js-wait-next').classList.add('c-is-hidden');
    const Liedjeid = lied.liedjeID;
    const Titel = lied.Titel;
    const Artiest = lied.Artiest;
    const slider = document.querySelector('.js-rateslider');
    const htmlSubmit = document.querySelector('.js-submit');
    slider.innerHTML = `<div class="js-slidecontainer">
        <input type="range" min="0" max="5" value="2.5" step = "0.1" class="js-slider" id="myRange">
      </div>`;
    htmlArtiest.innerHTML = `<p>Artiest: ${Artiest}</p>`;
    htmltitel.innerHTML = `<p>Titel: ${Titel}</p>`;
    htmlSubmit.innerHTML = 'Versturen';
    htmlSubmit.dataset.liedID = Liedjeid;
  });
  socketio.on('B2F_iedereen_klaar', function () {
    document.querySelector('.js-wachten-op-start').classList.add('c-is-hidden');
    document.querySelector('.js-student').classList.add('c-is-hidden');
    document.querySelector('.js-wait').classList.add('c-is-hidden');
    document.querySelector('.js-rate').classList.remove('c-is-hidden');
    htmlArtiest = document.querySelector('.js-artiest');
    htmltitel = document.querySelector('.js-titel');
    htmlForm = document.querySelector('.js-form');
    listenToVersturen();
  });
  socketio.on('B2F_finished', function () {
    document.querySelector('.js-wachten-op-start').classList.add('c-is-hidden');
    document.querySelector('.js-student').classList.add('c-is-hidden');
    document.querySelector('.js-wait').classList.add('c-is-hidden');
    document.querySelector('.js-rate').classList.add('c-is-hidden');
    document
      .querySelector('.js-summary-student')
      .classList.remove('c-is-hidden');
  });
  socketio.on('B2FWaitForStart', function () {
    listenTosubmitBtn();
    document.querySelector('.js-wachten-op-start').classList.add('c-is-hidden');
    document.querySelector('.js-student').classList.remove('c-is-hidden');
  });
  socketio.on('b2f_force_skip', function () {
    if (!document.querySelector('.js-form').classList.contains('c-is-hidden')) {
      document.querySelector('.js-form').classList.add('c-is-hidden');
      document.querySelector('.js-wait-next').classList.remove('c-is-hidden');
    } else {
      document.querySelector('.js-wait-next').innerHTML = `      
      <div class="u-position-center__low u-high-emphasis u-fz-large">wacht even op volgende Rating
      </div>
      <img src="img/svg/Ripple-1s-200px.svg" alt="" class="u-position-center__high"></img>`;
    }
  });
};

const listenToVersturen = function () {
  const htmlSubmit = document.querySelector('.js-submit');

  htmlSubmit.addEventListener('click', function () {
    const sliderVal = document.querySelector('.js-slider').value;
    const wait = document.querySelector('.js-wait-next');
    wait.classList.remove('c-is-hidden');
    wait.innerHTML = `<div class="u-position-center__low u-text-center u-high-emphasis u-fz-large">Rating is ontvangen (${sliderVal}), </br>wacht eventjes op de rest
    </div>
    <img src="img/svg/Ripple-1s-200px.svg" alt="" class="u-position-center__high">`;
    const id = this.dataset.liedID;
    socketio.emit('F2BRate', { rating: sliderVal, id: id });
    htmlForm.classList.add('c-is-hidden');
  });
};
const listenTosubmitBtn = function () {
  let btn = document.querySelector('.js-submit-btn');
  btn.addEventListener('click', function () {
    console.log('submit');
    const Artiest = document.querySelector('.js-inputliedje__artiest').value;
    const Titel = document.querySelector('.js-inputliedje__titel').value;
    const link = document.querySelector('.js-inputliedje__yt_link').value;
    if (Artiest && Titel && link) {
      let output = re.exec(link);
      if (output) {
        const url = backend + '/liedjes/';
        const body = JSON.stringify({
          artiest: Artiest,
          titel: Titel,
          url: link,
        });
        handleData(url, ShowWait, callbackError, 'POST', body);
      } else {
        ShowError('Geen juiste Youtube url opgegeven');
      }
    } else if (Artiest && Titel) {
      const link = 'NONE';
      const url = backend + '/liedjes/';
      const body = JSON.stringify({
        artiest: Artiest,
        titel: Titel,
        url: link,
      });
      handleData(url, ShowWait, callbackError, 'POST', body);
    } else {
      ShowError('Gelieve een artiest, titel en url mee te geven!');
    }
  });
};

// #endregion

// #region *** Teacher ***

const init_teacher = function () {
  console.log('dashboard');
  listenToSocket();
  htmlCount = document.querySelector('.js-count');
  htmlKlaar = document.querySelector('.js-klaar');
  HTMLaantalRatings = document.querySelector('.js-aantal-ratings');
  htmlGetResult = document.querySelector('.js-get-result');
  HTMLAverage = document.querySelector('.js-average');
  htmlnext = document.querySelector('.js-next');
  htmltitel = document.querySelector('.js-titel');
  htmlArtiest = document.querySelector('.js-artiest');
  htmlyoutube = document.querySelector('.js-youtube');
  start();
};

const start = function () {
  document.querySelector('.js-url').innerHTML = `
    Surf naar ${window.location.origin}/front/
  `;
  document.querySelector('.js-start').addEventListener('click', function () {
    socketio.emit('F2B_start');
    document.querySelector('.js-instructies').classList.add('c-is-hidden');
    document.querySelector('.js-begin').classList.remove('c-is-hidden');
    ListenToKlaarBtn();
    listenToNext();
  });
};

const showRating = function (jsonObject) {
  console.log(jsonObject.rating.aantal);
  HTMLAverage.innerHTML = `<p>Beoordeeling: ${jsonObject.rating.aantal.toFixed(
    2
  )} ⭐</p>`;
  HTMLAverage.classList.remove('c-is-hidden');
};

const showNextItem = function (jsonLiedje) {
  console.log(jsonLiedje);
  if (jsonLiedje.liedje == null) {
    getSummary();
    socketio.emit('F2B_start_summary');
  } else if (jsonLiedje.liedje) {
    console.log(jsonLiedje);
    const url = jsonLiedje.liedje.URL;
    if (url != 'NONE') {
      const regex = re.exec(url);
      htmlyoutube.innerHTML = `<iframe class = "c-youtube-iframe"
  src="https://www.youtube.com/embed/${regex[1]}" frameborder="0" allowfullscreen>
  </iframe>`;
    } else {
      htmlyoutube.innerHTML = `Geen Youtube Link opgegeven`;
    }
    htmltitel.innerHTML = `<p>Titel: ${jsonLiedje.liedje.Titel}</p>`;
    htmlArtiest.innerHTML = `<p>Artiest: ${jsonLiedje.liedje.Artiest}</p>`;
    const id = jsonLiedje.liedje.idLiedjes;
    socketio.emit('F2B_rate', { liedjeID: id });
    htmlGetResult.dataset.LiedjeID = id;
    htmlGetResult.classList.remove('c-is-hidden');
    currentliedje = id;
  }
};

const showSummary = function (jsonLiedjes) {
  document.querySelector('.js-begin').classList.add('c-is-hidden');
  document.querySelector('.js-summary').classList.remove('c-is-hidden');
  const liedjes = jsonLiedjes.liedjes;
  let html =
    '<th>Plaats</th><th>Artiest</th><th>Titel</th><th>Beoordeling</th>';
  let i = 1;
  for (let liedje of liedjes) {
    console.log(liedje);

    html += `<tr class="js-summary__list--item data-liedje_id = ${
      liedje.idliedjes
    }">
                <td class="c-placement">${i}</td>
                <td class="c-artiest">${liedje.artiest}</td>
                <td class="c-titel">${liedje.titel}</td>
                <td class="c-rating">${liedje.rating.toFixed(2)}⭐</td>
            </tr>`;
    i += 1;
  }
  document.querySelector('.js-summary__list').innerHTML = html;
  listenToReset();
};

const listenToSocket = function () {
  socketio.on('connect', function () {
    console.log('verzonden met de socketio webserver.');
    socketio.emit('F2BAuth', { type: 'Teacher' });
  });
  socketio.on('B2F_count', function (msg) {
    console.log('Nieuwe count', msg['aantal']);
    aantalInzendingen = msg['aantal'];
    htmlCount.innerHTML = `<p>Aantal inzendingen: ${msg['aantal']}</p>`;
  });
  socketio.on('B2F_rating_count', function (msg) {
    console.log(msg);
    HTMLaantalRatings.innerHTML = `<p>Aantal beoordelingen: ${msg['aantal']}</p>`;
  });
};

const ListenToKlaarBtn = function () {
  htmlKlaar.addEventListener('click', function () {
    socketio.emit('F2B_iedereen_klaar');
    this.innerHTML = '';
    htmlCount.innerHTML = '';
    htmlCount.classList.add('c-is-hidden');
    getEersteID();
    HTMLaantalRatings.classList.remove('c-is-hidden');
    HTMLaantalRatings.innerHTML = `<p>Aantal beoordelingen: 0</p>`;
    // getLiedjes();
  });
};

const listenToNext = function () {
  htmlnext.addEventListener('click', function () {
    console.log('next');
    htmlnext.classList.add('c-is-hidden');
    HTMLAverage.classList.add('c-is-hidden');
    HTMLaantalRatings.innerHTML = `<p>Aantal beoordelingen: 0</p>`;
    getLiedje();
  });
};

const listenToResult = function () {
  htmlGetResult.addEventListener('click', function () {
    htmlGetResult.classList.add('c-is-hidden');
    htmlnext.classList.remove('c-is-hidden');
    const id = this.dataset.LiedjeID;
    const url = backend + `/ratings/${id}`;
    handleData(url, showRating, callbackError);
    socketio.emit('F2B_result_shown');
  });
};

const listenToReset = function () {
  document.querySelector('.js-restart').addEventListener('click', function () {
    const url = backend + '/liedjes/';
    handleData(url, callbackDelete, callbackError, 'DELETE');
  });
};
const getEersteID = function () {
  const url = backend + `/eersteID/`;
  handleData(url, callbackEersteItem, callbackError);
};
const getLiedje = function () {
  const url = backend + `/liedje/${currentliedje + 1}/`;
  handleData(url, showNextItem, callbackError);
};
const getSummary = function () {
  console.log('ShowSummary');
  const url = backend + `/liedjes/summary/`;
  handleData(url, showSummary, callbackError);
};
const getLiedjes = function () {
  const url = backend + '/liedjes/';
  handleData(url, showItem, callbackError);
};

const callbackEersteItem = function (jsonElement) {
  currentliedje = jsonElement.liedjeID.idLiedjes;
  listenToResult();
  getLiedje();
};

const callbackDelete = function (jsonElement) {
  document.querySelector('.js-summary').classList.add('c-is-hidden');
  document.querySelector('.js-instructies').classList.remove('c-is-hidden');
  aantalInzendingen = 0;
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = function () {
  console.log('Init complete');
  if (document.querySelector('.js-student')) {
    init_student();
  } else if (document.querySelector('.js-dashboard')) {
    init_teacher();
  }
};

document.addEventListener('DOMContentLoaded', init);
// #endregion
