var seen_words = []

function getRandomInt(min, max) {
min = Math.ceil(min);
max = Math.floor(max);
return Math.floor(Math.random() * (max - min + 1)) + min;
}

var last_used_json_url = "";
function set_card_texts(jsonUrl = last_used_json_url, word_index = -1) {
fetch(jsonUrl)
  .then(response => response.json())
  .then(jsonData => {
    last_used_json_url = jsonUrl
    // Parse the JSON data

    // Index belirtilmemiş ise rastgale seç.
    if (word_index == -1) {
      if(Object.keys(jsonData.c).length == seen_words.length){
      // Gösterilmemiş kelime kalmadıysa
      seen_words = []
      }
      do {word_index = getRandomInt(0, Object.keys(jsonData.c).length - 1);}
      while (seen_words.includes(word_index)); // Check if word_index is already in seen_words
      seen_words.push(word_index);
    }
    // alert(word_index);
    //alert(seen_words)

    //alert(JSON.parse(sessionStorage.getItem('settings')))
    //alert(jsonData.c[0].t) // Kart başlığı
    //alert(jsonData.c[0].b) // Yasaklı kelimeler

    /* JSON.parse(sessionStorage.getItem('settings'))[index]
    0, lang
    1, category
    2, round
    3, time
    4, skip
    5, taboos
    6, forbidden 
    7, blackword
    */

    // Get the HTML element

    var card_title = document.getElementById('title-word-id');
    var card_forbidden_words = document.getElementById('forbidden-words-id');

    // Set the text content of the HTML element
    card_title.textContent = jsonData.c[word_index].t; // Kart başlığı

    var forbidden_words_candidates = jsonData.c[word_index].b
    var forbidden_words_chosen = []
    var forbidden_words_count = JSON.parse(sessionStorage.getItem('settings'))[6]

    for (var i = 0; i < forbidden_words_count; i++) {
      var selected_word = Math.floor(Math.random() * forbidden_words_candidates.length);
      forbidden_words_chosen.push(forbidden_words_candidates[selected_word])
      console.log(forbidden_words_candidates[selected_word])
      forbidden_words_candidates.splice(selected_word, 1)
    }
    // var forbidden_words = String(forbidden_words_chosen).replace(/,/g, '');
    var forbidden_words = "";
    var blackword_index = getRandomInt(0, forbidden_words_chosen.length-1);
    for (let i = 0; i < forbidden_words_chosen.length; i++) {
      var button_class = "forbidden-button";
      var onclick = '';

      if(i == blackword_index && JSON.parse(sessionStorage.getItem('settings'))[7]){
        button_class = "blackword-button";
        onclick = `onclick='incrementStat("blackword"); round_ended();''`; // Siyah kelimeye dokunulur
      }
      forbidden_words += '<button class="'+button_class+'"'+onclick+'>'+ forbidden_words_chosen[i] +'</button>';
    } 
    // alert(forbidden_words_chosen);
    card_forbidden_words.innerHTML = forbidden_words; // Yasaklı kelimeler
    
  })
  .catch(error => {
    console.error('Error fetching the JSON data:', error);
  });
}

/////////////////////////////////////////////


var timerInterval;
var timerPaused = false;
var timerRemainingTime = 60000; // Varsayılan süre 60 saniye
var round_over = false
window.gwd = window.gwd || {};

function updateTimer() {
  var displayText = "∞";
  if (!timerPaused) {
    timerRemainingTime -= 100; // 0.1 saniye düşür
  }
  if (timerRemainingTime > -1000) {
    var minutes = Math.floor(timerRemainingTime / 60000);
    var seconds = Math.floor((timerRemainingTime % 60000) / 1000);
    var formattedSeconds = (seconds < 10 ? '0' : '') + seconds;
    
    var milliseconds = Math.floor(timerRemainingTime % 1000);
    var formattedMilliseconds = milliseconds.toString().charAt(0); // Extract the first character

    displayText = minutes + ":" + formattedSeconds + "." + formattedMilliseconds;

    if (timerRemainingTime <= 0) {
      clearInterval(timerInterval);
      round_ended()
      // Zamanlayıcı bittiğinde yapılacak işlemler
    }
  }
  document.getElementById('timerDisplay').innerHTML = displayText
}

function save_settings() {
  var lang = document.getElementById('dm_lang').value;
  var category = document.getElementById('dm_category').value;
  var round = document.getElementById('dm_round').value;
  var time = document.getElementById('dm_time').value;
  var skip = document.getElementById('dm_skip').value;
  var taboos = document.getElementById('dm_taboos').value;
  var forbidden = document.getElementById('dm_forbidden').value;
  var blackword = document.getElementById('cb_blackword').checked;
  sessionStorage.setItem('settings', JSON.stringify([lang, category, round, time, skip, taboos, forbidden, blackword]));
  // Ayarları cookie olarak kaydeder.
  // alert(JSON.parse(sessionStorage.getItem('settings')));
};

function resume_game() {
  // Durdurma overlay'ini görünmez yapar, sayacı devam ettirir.
  document.getElementById('pause_overlay_id').style.visibility = 'hidden';
  document.getElementById('game_elements').style.filter = 'blur(0rem)';
  document.getElementById('pause_button_text').innerHTML = 'I I';
  if (round_over){
    start_round();
  }

  if (timerPaused) {
    timerInterval = setInterval(updateTimer, 100);
    timerPaused = false;
  }
};

function pause_game() {
  document.getElementById('pause_overlay_id').style.visibility = 'visible';
  document.getElementById('game_elements').style.filter = 'blur(1rem)';
  document.getElementById('pause_button_text').innerHTML = '&#9654';
  clearInterval(timerInterval);
  timerPaused = true;
};

function round_ended() {
  round_over = true;
  pause_game();
};