'use strict';

const backend_IP = `http://${window.location.hostname}:5000`;
const backend = backend_IP + '/api/v1';
const lanIP = `${window.location.hostname}:5000`;
// let socketio;
// try {
//   socketio = io(lanIP);
// } catch {
//   console.log('geen socketio');
// }
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
let once = false;
let stopPollingForceRate = false;
let gaVerder = false
let status_backend = -1;
let StudentRatingID, aantalInzendingen, aantalRatings;
const pollingInterval = 800;
let currentliedjeStudent;
let stop_client = false;

let hoe = `Deze server is in elkaar gestoken in een weekendje, met behulp van de lamp methode (linux, apache, mysql & python)
De webserver (frontend server) draait op apache, en is geschreven met html, css en js. 
De backend server is geschreven in python, met behulp van flask 
verder is de database een MySql database op een mariadb server. Alles draait op een debian vm.
In totaal heeft dit project een 16-tal uren ingenomen, en zo'n 2000 lijntjes code`
let voorlopen = `Ah, je wil voorlopen zie ik. kan op twee manieren, je kan alle ingezonden liedjes zien: surf naar ${window.location.origin}:5000/api/v1/liedjes/ .
 Als je al wil raten (meer advanced), kan dit door een POST request te doen naar in de console 'socketio.emit('F2BRate', { rating: sliderVal, id: id }) te doen. Rate is een waarde tussen 0-5 en id is het id die je kan zien in de ingezonden liedes, veel succes!'`
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
  console.info("ge hebt de console gevonden, indien u wilt weten hoe deze server in elkaar zit, typ dan 'hoe' in de console, als je wil voorlopen, typ dan voorlopen in de console De repo is opensource, ga naar https://github.com/JarneDel/Songfestival om de bronbestanden te bekijken")
  const url = backend + '/auth/user/'
  handleData(url, callbackUserAuth, callbackError)

  // listenToSocketstudent();
};

const callbackUserAuth = function (jsonObject) {
  // console.log(jsonObject.auth.type)
  // console.log(jsonObject.auth.status)
  if (jsonObject.auth.type == 'student') {
    // console.log("welkom")
    checkpagina(jsonObject.auth.status)
  }
}
const getStatus = function () {
  // console.log("Waiting for teacher")
  const url = backend + '/user/waitforstart/'
  handleData(url, function (jsonObject) {
    console.log(jsonObject.status)
    if (jsonObject.status >= 0) {
      status_backend = 0;
      iedereenKlaar();

    } else if (jsonObject.status == -1) {
      WaitForTeacher()
    }
  }, callbackError)

}
const iedereenKlaar = function () {
  listenTosubmitBtn();
  listenToForceRate();
  document.querySelector('.js-wachten-op-start').classList.add('c-is-hidden');
  document.querySelector('.js-student').classList.remove('c-is-hidden');
}
const getForseRate = function () {
  const url = backend + '/student/forcerate/'
  handleData(url, function (jsonObject) {
    // console.log("forcerate", jsonObject)
    if (jsonObject.forcerate) {
      document.querySelector('.js-student').classList.add('c-is-hidden');
      document.querySelector('.js-wait').classList.remove('c-is-hidden');
      waitForRating();
    } else {
      listenToForceRate()
    }

  }, callbackError)
}


const listenToForceRate = function () {
  if (!stopPollingForceRate) {
    setTimeout(getForseRate, pollingInterval)
  }
}

const WaitForTeacher = function () {
  if (status_backend == -1) {
    setTimeout(getStatus, pollingInterval)
  }
}
const checkpagina = function (status) {
  if (status == -1) {
    document
      .querySelector('.js-wachten-op-start')
      .classList.remove('c-is-hidden');
    document.querySelector('.js-student').classList.add('c-is-hidden');
    document.querySelector('.js-wait').classList.add('c-is-hidden');
    document.querySelector('.js-rate').classList.add('c-is-hidden');
    WaitForTeacher()
  }
  if (status == 0) {
    document
      .querySelector('.js-wachten-op-start')
      .classList.add('c-is-hidden');
    document.querySelector('.js-student').classList.remove('c-is-hidden');
    document.querySelector('.js-wait').classList.add('c-is-hidden');
    document.querySelector('.js-rate').classList.add('c-is-hidden');
    listenTosubmitBtn();
  } else if (status == 1) {
    document
      .querySelector('.js-wachten-op-start')
      .classList.add('c-is-hidden');
    document.querySelector('.js-student').classList.add('c-is-hidden');
    document.querySelector('.js-wait').classList.add('c-is-hidden');
    document.querySelector('.js-rate').classList.remove('c-is-hidden');
    htmlArtiest = document.querySelector('.js-artiest');

    htmltitel = document.querySelector('.js-titel');
    htmlForm = document.querySelector('.js-form');
    getStatusRating();
    // const url = backend + '/rating/refesh/'
    // handleData(url, callbackRatingOnRefesh, callbackError)

  } else if (status == 2) {
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
}


const ShowWait = function (jsonElement) {
  if (jsonElement.LiedjeID) {
    document.querySelector('.js-student').classList.add('c-is-hidden');
    document.querySelector('.js-wait').classList.remove('c-is-hidden');
    StudentRatingID = jsonElement.liedjeID;
    waitForRating();

  } else {
    document.querySelector('.js-input__error').innerhtml =
      'Error, probeer opnieuw';
  }
};

const getStatusRating = function () {
  // console.log("Polling rating")
  const url = backend + '/student/status/rating/'
  handleData(url, function (jsonObject) {
    // console.log(jsonObject)
    if (jsonObject.status == 1) {
      ratingPagina()
    } else {
      waitForRating()
    }
  }, callbackError)
}

const waitForRating = function () {
  setTimeout(getStatusRating, pollingInterval)
}

const ratingPagina = function () {
  document
    .querySelector('.js-wachten-op-start')
    .classList.add('c-is-hidden');
  document.querySelector('.js-student').classList.add('c-is-hidden');
  document.querySelector('.js-wait').classList.add('c-is-hidden');
  document.querySelector('.js-rate').classList.remove('c-is-hidden');
  htmlArtiest = document.querySelector('.js-artiest');
  htmltitel = document.querySelector('.js-titel');
  htmlForm = document.querySelector('.js-form');

  const url = backend + '/rating/refesh/'
  handleData(url, callbackRatingOnRefesh, callbackError)
}

// const listenToSocketstudent = function () {
// socketio.on('connect', function () {
//   console.log('Verboden met webserver');

//   socketio.emit('F2BAuth', { type: 'student' });
// });
// socketio.on('B2F_user_status', function (msg) {
//   if (msg.status == -1) {
//     document
//       .querySelector('.js-wachten-op-start')
//       .classList.remove('c-is-hidden');
//     document.querySelector('.js-student').classList.add('c-is-hidden');
//     document.querySelector('.js-wait').classList.add('c-is-hidden');
//     document.querySelector('.js-rate').classList.add('c-is-hidden');
//   }
//   if (msg.status == 0) {
//     document
//       .querySelector('.js-wachten-op-start')
//       .classList.add('c-is-hidden');
//     document.querySelector('.js-student').classList.remove('c-is-hidden');
//     document.querySelector('.js-wait').classList.add('c-is-hidden');
//     document.querySelector('.js-rate').classList.add('c-is-hidden');
//     listenTosubmitBtn();
//   } else if (msg.status == 1) {
//     document
//       .querySelector('.js-wachten-op-start')
//       .classList.add('c-is-hidden');
//     document.querySelector('.js-student').classList.add('c-is-hidden');
//     document.querySelector('.js-wait').classList.add('c-is-hidden');
//     document.querySelector('.js-rate').classList.remove('c-is-hidden');
//     htmlArtiest = document.querySelector('.js-artiest');
//     htmltitel = document.querySelector('.js-titel');
//     htmlForm = document.querySelector('.js-form');

//     const url = backend + '/rating/refesh/'
//     handleData(url, callbackRatingOnRefesh, callbackError)

//   } else if (msg.status == 2) {
//     document
//       .querySelector('.js-wachten-op-start')
//       .classList.add('c-is-hidden');
//     document.querySelector('.js-student').classList.add('c-is-hidden');
//     document.querySelector('.js-wait').classList.add('c-is-hidden');
//     document.querySelector('.js-rate').classList.add('c-is-hidden');
//     document
//       .querySelector('.js-summary-student')
//       .classList.remove('c-is-hidden');
//   }
// });

//   socketio.on('B2F_Rate', function (lied) {
//     htmlForm.classList.remove('c-is-hidden');
//     document.querySelector('.js-wait-next').classList.add('c-is-hidden');
//     const Liedjeid = lied.liedjeID;
//     const Titel = lied.Titel;
//     const Artiest = lied.Artiest;
//     const slider = document.querySelector('.js-rateslider');
//     const htmlSubmit = document.querySelector('.js-submit');
//     slider.innerHTML = `<div class="js-slidecontainer">
//         <input type="range" min="0" max="5" value="2.5" step = "0.1" class="js-slider" id="myRange">
//       </div>`;
//     htmlArtiest.innerHTML = `<p>Artiest: ${Artiest}</p>`;
//     htmltitel.innerHTML = `<p>Titel: ${Titel}</p>`;
//     htmlSubmit.innerHTML = 'Versturen';
//     htmlSubmit.dataset.liedID = Liedjeid;
//   });
//   socketio.on('B2F_iedereen_klaar', function () {
//     document.querySelector('.js-wachten-op-start').classList.add('c-is-hidden');
//     document.querySelector('.js-student').classList.add('c-is-hidden');
//     document.querySelector('.js-wait').classList.add('c-is-hidden');
//     document.querySelector('.js-rate').classList.remove('c-is-hidden');
//     htmlArtiest = document.querySelector('.js-artiest');
//     htmltitel = document.querySelector('.js-titel');
//     htmlForm = document.querySelector('.js-form');
//     listenToVersturen();
//   });
//   socketio.on('B2F_finished', function () {
//     document.querySelector('.js-wachten-op-start').classList.add('c-is-hidden');
//     document.querySelector('.js-student').classList.add('c-is-hidden');
//     document.querySelector('.js-wait').classList.add('c-is-hidden');
//     document.querySelector('.js-rate').classList.add('c-is-hidden');
//     document
//       .querySelector('.js-summary-student')
//       .classList.remove('c-is-hidden');
//   });
//   socketio.on('B2FWaitForStart', function () {
//     listenTosubmitBtn();
//     document.querySelector('.js-wachten-op-start').classList.add('c-is-hidden');
//     document.querySelector('.js-student').classList.remove('c-is-hidden');
//   });
//   socketio.on('b2f_force_skip', function () {
//     if (!document.querySelector('.js-form').classList.contains('c-is-hidden')) {
//       document.querySelector('.js-form').classList.add('c-is-hidden');
//       document.querySelector('.js-wait-next').classList.remove('c-is-hidden');
//     } else {
//       document.querySelector('.js-wait-next').innerHTML = `      
//       <div class="u-position-center__low u-high-emphasis u-fz-large">wacht even op volgende Rating
//       </div>
//       <img src="img/svg/Ripple-1s-200px.svg" alt="" class="u-position-center__high"></img>`;
//     }
//   });
// };

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
    const url = backend + '/student/rate/'
    const body = JSON.stringify({ rating: sliderVal, id: id })
    handleData(url, function (jsonObject) {
      // console.log(jsonObject)
      waitfornexSong()
    }, callbackError, 'POST', body)
    htmlForm.classList.add('c-is-hidden');
  });
};

const waitfornexSong = function () {
  // console.log("waiting")
  if (stop_client == false) {
    setTimeout(ListenToNewRate, pollingInterval)
  }
}
const ListenToNewRate = function () {
  const url = backend + `/student/currentsong/`
  handleData(url, function (jsonObject) {
    if (jsonObject.currentLiedjeID != currentliedjeStudent) {
      // console.log("Ga naar volgende nummer om te raten")
      currentliedjeStudent = jsonObject.currentLiedjeID
      nextRating()
      listenToForceSkip()
    } else {
      waitfornexSong()
    }
  }, callbackError)
}

const nextRating = function () {
  const url = backend + '/student/rate/'

  handleData(url, function (jsonObject) {
    htmlForm.classList.remove('c-is-hidden');
    document.querySelector('.js-wait-next').classList.add('c-is-hidden');
    let lied = jsonObject.lied
    const Liedjeid = lied.liedjeID;
    const Titel = lied.Titel;
    const Artiest = lied.Artiest;
    currentliedjeStudent = Liedjeid
    const slider = document.querySelector('.js-rateslider');
    slider.innerHTML = `<div class="js-slidecontainer">
      <input type="range" min="0" max="5" value="2.5" step = "0.1" class="js-slider" id="myRange">
    </div>`;
    const htmlSubmit = document.querySelector('.js-submit');
    htmlArtiest.innerHTML = `<p>Artiest: ${Artiest}</p>`;
    htmltitel.innerHTML = `<p>Titel: ${Titel}</p>`;
    htmlSubmit.innerHTML = 'Versturen';
    htmlSubmit.dataset.liedID = Liedjeid;
  }, callbackError)

}
const listenToForceSkip = async function () {
  // console.log("ListeningToForceSkip")
  const urlForceSkip = backend + '/student/forceskip/'
  handleData(urlForceSkip, function (jsonObject) {
    // console.log(jsonObject)
    if (jsonObject.forceskip == 0) {
      repeatListen()
    } else if (jsonObject.forceskip == true) {
      if (!document.querySelector('.js-form').classList.contains('c-is-hidden')) {
        document.querySelector('.js-form').classList.add('c-is-hidden');
        document.querySelector('.js-wait-next').classList.remove('c-is-hidden');
        waitfornexSong()
      } else {
        document.querySelector('.js-wait-next').innerHTML = `      
              <div class="u-position-center__low u-high-emphasis u-fz-large">wacht even op volgende Rating
              </div>
              <img src="img/svg/Ripple-1s-200px.svg" alt="" class="u-position-center__high"></img>`;
      }
    }
  }, callbackError)
  return true
}

const repeatListen = function () {
  if (stop_client == false) {
    setTimeout(listenToForceSkip, pollingInterval)
  }
}


const listenTosubmitBtn = function () {

  let btn = document.querySelector('.js-submit-btn');
  btn.addEventListener('click', function () {
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

const callbackRatingOnRefesh = function (lied) {
  htmlForm.classList.remove('c-is-hidden');
  document.querySelector('.js-wait-next').classList.add('c-is-hidden');
  const Liedjeid = lied.liedjeID;
  const Titel = lied.Titel;
  const Artiest = lied.Artiest;
  currentliedjeStudent = Liedjeid
  const slider = document.querySelector('.js-rateslider');
  slider.innerHTML = `<div class="js-slidecontainer">
    <input type="range" min="0" max="5" value="2.5" step = "0.1" class="js-slider" id="myRange">
  </div>`;
  const htmlSubmit = document.querySelector('.js-submit');
  htmlArtiest.innerHTML = `<p>Artiest: ${Artiest}</p>`;
  htmltitel.innerHTML = `<p>Titel: ${Titel}</p>`;
  htmlSubmit.innerHTML = 'Versturen';
  htmlSubmit.dataset.liedID = Liedjeid;
  listenToScoreboard()
  listenToForceSkip()
  listenToVersturen();
}

const listenToScoreboard = function () {
  // console.log("Listening to scoreboard")
  setTimeout(function () {
    const url = backend + '/student/scoreboard/'
    handleData(url, function (jsonObject) {
      // console.log(jsonObject)
      if (jsonObject.scoreboard.force == false) {
        listenToScoreboard()
      } else if (jsonObject.scoreboard.force) {
        document.querySelector('.js-wachten-op-start').classList.add('c-is-hidden');
        document.querySelector('.js-student').classList.add('c-is-hidden');
        document.querySelector('.js-wait').classList.add('c-is-hidden');
        document.querySelector('.js-rate').classList.add('c-is-hidden');
        document
          .querySelector('.js-summary-student')
          .classList.remove('c-is-hidden');
        stop_client = true;
      }
    }, callbackError)
  }, pollingInterval)
}


// #endregion

// #region *** Teacher ***

const init_teacher = function () {
  // listenToSocket();
  const url = backend + '/auth/teacher/'
  handleData(url, callbackAuthTeacher, callbackError)
  htmlCount = document.querySelector('.js-count');
  htmlKlaar = document.querySelector('.js-klaar');
  HTMLaantalRatings = document.querySelector('.js-aantal-ratings');
  htmlGetResult = document.querySelector('.js-get-result');
  HTMLAverage = document.querySelector('.js-average');
  htmlnext = document.querySelector('.js-next');
  htmltitel = document.querySelector('.js-titel');
  htmlArtiest = document.querySelector('.js-artiest');
  htmlyoutube = document.querySelector('.js-youtube');

};
const callbackAuthTeacher = function (jsonObject) {
  // console.log(jsonObject.auth.type)
  // console.log(jsonObject.auth.status)
  if (jsonObject.auth.type == 'teacher') {
    // console.log("welkom leerkracht");
    start();
    listenToReset();
  }
}

const start = function () {
  document.querySelector('.js-url').innerHTML = `
    Surf naar ${window.location.origin}
  `;
  document.querySelector('.js-start').addEventListener('click', function () {
    const url = backend + "/start/"
    handleData(url, callbackStarted, callbackError)
  });
};
const callbackStarted = function (jsonObject) {
  if (jsonObject.status == 0) {
    // console.log('start')
    document.querySelector('.js-instructies').classList.add('c-is-hidden');
    document.querySelector('.js-begin').classList.remove('c-is-hidden');
    pollcount()
    ListenToKlaarBtn()
    listenToNext()
  }
}

const showRating = function (jsonObject) {
  HTMLAverage.innerHTML = `<p>Beoordeeling: ${jsonObject.rating.aantal.toFixed(
    2
  )} ⭐</p>`;
  HTMLAverage.classList.remove('c-is-hidden');
};

const showNextItem = function (jsonLiedje) {
  if (jsonLiedje.liedje == null) {
    getSummary();
    // socketio.emit('F2B_start_summary');
  } else if (jsonLiedje.liedje) {
    // console.log("liedje", jsonLiedje.liedje.idLiedjes)
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
    // socketio.emit('F2B_rate', { liedjeID: id });
    htmlGetResult.dataset.LiedjeID = id;
    htmlGetResult.classList.remove('c-is-hidden');
    currentliedje = id;
    once = false
    waitForRatingCount();
  }
};
const getRatingCount = function () {
  let id = currentliedje
  const url = backend + `/teacher/rating/count/${id}/`
  handleData(url, function (jsonObject) {
    // console.log(jsonObject)
    const aantal = jsonObject.rating.aantal
    const Liedjeid = jsonObject.rating.idLiedje
    if (Liedjeid == id) {
      HTMLaantalRatings.innerHTML = `<p>Aantal beoordelingen: ${aantal}</p>`
      HTMLaantalRatings.dataset.aantal = aantal
    }
    if (once == 0) {
      waitForRatingCount()
    }
  }, callbackError)
}


const waitForRatingCount = function () {
  // console.log("Niewe timeout")
  // setTimeout(getRatingCount(currentliedje), 1000)
  setTimeout(getRatingCount, pollingInterval)
}

const showSummary = function (jsonLiedjes) {
  document.querySelector('.js-begin').classList.add('c-is-hidden');
  document.querySelector('.js-summary').classList.remove('c-is-hidden');
  const liedjes = jsonLiedjes.liedjes;
  let html =
    '<th>Plaats</th><th>Artiest</th><th>Titel</th><th>Beoordeling</th>';
  let i = 1;
  for (let liedje of liedjes) {

    html += `<tr class="js-summary__list--item data-liedje_id = ${liedje.idliedjes
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


const getCount = function () {
  const url = backend + '/count/'
  handleData(url, function (jsonObject) {
    aantalInzendingen = jsonObject.count.aantal
    htmlCount.innerHTML = `<p>Aantal inzendingen: ${jsonObject.count.aantal}</p>`;
  }, callbackError)
  pollcount()
}
async function pollcount() {
  if (!gaVerder) {
    setTimeout(getCount, pollingInterval)
  }
  return true
}


const listenToSocket = function () {
  // socketio.on('connect', function () {
  //   console.log('verzonden met de socketio webserver.');
  //   socketio.emit('F2BAuth', { type: 'Teacher' });
  // });
  // socketio.on('B2F_count', function (msg) {
  //   aantalInzendingen = msg['aantal'];
  //   htmlCount.innerHTML = `<p>Aantal inzendingen: ${msg['aantal']}</p>`;
  // });
  // socketio.on('B2F_rating_count', function (msg) {
  //   aantalRatings = msg['aantal']
  //   HTMLaantalRatings.innerHTML = `<p>Aantal beoordelingen: ${msg['aantal']}</p>`;
  // });
};

const ListenToKlaarBtn = function () {
  htmlKlaar.addEventListener('click', function () {
    if (aantalInzendingen) {
      gaVerder = true
      const url = backend + '/teacher/continue/'
      handleData(url, callbackKlaar, callbackError)
      this.innerHTML = '';
      // getLiedjes();
    }
  })
    ;
};
const callbackKlaar = function (jsonObject) {
  if (jsonObject.status == 1) {
    htmlCount.innerHTML = '';
    htmlCount.classList.add('c-is-hidden');
    getEersteID();
    HTMLaantalRatings.classList.remove('c-is-hidden');
    HTMLaantalRatings.innerHTML = `<p>Aantal beoordelingen: 0</p>`;
  }
  else {
    // console.log("er ging iets fout")
  }

}

const listenToNext = function () {
  htmlnext.addEventListener('click', function () {
    htmlnext.classList.add('c-is-hidden');
    HTMLAverage.classList.add('c-is-hidden');
    HTMLaantalRatings.innerHTML = `<p>Aantal beoordelingen: 0</p>`;
    getLiedje();
  });
};

const listenToResult = function () {
  htmlGetResult.addEventListener('click', function () {
    if (HTMLaantalRatings.dataset.aantal > 0) {
      once = true
      htmlGetResult.classList.add('c-is-hidden');
      htmlnext.classList.remove('c-is-hidden');
      const id = this.dataset.LiedjeID;
      const url = backend + `/ratings/${id}`;
      handleData(url, showRating, callbackError);
    }
  });
};

const listenToReset = function () {
  document.querySelector('.js-restart').addEventListener('click', function () {
    const url = backend + '/liedjes/';
    handleData(url, callbackDelete, callbackError, 'DELETE');
  });
  document.querySelector('.js-restart2').addEventListener('click', function () {
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
  const url = backend + `/liedjes/summary/`;
  handleData(url, showSummary, callbackError);
};
const getLiedjes = function () {
  const url = backend + '/liedjes/';
  handleData(url, showItem, callbackError);
};

const callbackEersteItem = function (jsonElement) {
  currentliedje = jsonElement.liedjeID.idLiedjes - 1;
  listenToResult();
  getLiedje();
};

const callbackDelete = function (jsonElement) {
  // console.log("Delete")
  document.querySelector('.js-summary').classList.add('c-is-hidden');
  document.querySelector('.js-instructies').classList.remove('c-is-hidden');
  aantalInzendingen = 0;
  document.location.reload(true);
};
// #endregion

// #region ***  Init / DOMContentLoaded                  ***********
const init = function () {
  if (document.querySelector('.js-student')) {
    init_student();
  } else if (document.querySelector('.js-dashboard')) {
    init_teacher();
  }
};

document.addEventListener('DOMContentLoaded', init);
// #endregion
