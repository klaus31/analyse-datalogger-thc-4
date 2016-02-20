var fs = require('fs')
var moment = require('moment');
var handlebars = require('handlebars')

function usageAndExit() {
  console.info('node auswertung.js txtfile');
  process.exit(1);
}

if(process.argv.length != 3) usageAndExit();

var TXTFILE = process.argv[2];

fs.access(TXTFILE, fs.R_OK, function(err) {
  if(err) {
    console.error('no access to ' + TXTFILE);
    usageAndExit();
  }
});

var createMessung = function (dataline) {
  var messwerte = dataline.trim().split(/[ ]+/)
  var messung = {
    id: messwerte[0] - 0,
    datum: {
      value: new Date(Date.parse(messwerte[1] + ' ' + messwerte[2])),
      day: messwerte[1],
      time: messwerte[2]
    },
    temperatur: messwerte[3] - 0,
    luftfeuchtigkeit: messwerte[4] - 0
  }
  return messung
}

var ausgabeAlleMessungen = function (result) {
  ausgabe(result, 'auswertung-all.tpl')
}
var ausgabe = function (result, tpl) {
  fs.readFile(__dirname + '/' + tpl, 'utf8', function (err, source) {
    var template = handlebars.compile(source)
    console.info(template(result))
  })
}

var ausgabeWeek = function (result) {
  ausgabe(result, 'auswertung-week.tpl')
}

var isStartOfLueftung = function (currentMessung, messungZeiger, prozentUnterschied) {
  prozentUnterschied = prozentUnterschied || 3
  return currentMessung.luftfeuchtigkeit + prozentUnterschied < messungZeiger.luftfeuchtigkeit
}

var auswertung = function (err, data) {
  var datalines = data.split('\r\n')
  var i = datalines.length
  var messungen = []
  while(i--) {
    var messung = createMessung(datalines[i])
    if (!messung.id) {
      continue
    }
    // array sammeln
    messungen.push(messung)
  }
  ausgabeAlleMessungen(getResult(messungen))
  splitMessungenPerWeeks(messungen).forEach(function(resultsWeek){
    ausgabeWeek(getResult(resultsWeek));
  })
}

var getResult = function(messungen) {
  var result = {
    datum: false,
    temperatur: false,
    luftfeuchtigkeit: false
  }

  var i = messungen.length
  var temperaturen = []
  var luftfeuchtigkeiten = []
  while(i--) {
    var messung = messungen[i];
    temperaturen.push(messung.temperatur)
    luftfeuchtigkeiten.push(messung.luftfeuchtigkeit)
    // messraum
    if (result.datum) {
      if (result.datum.von.value > messung.datum.value) {
        result.datum.von = messung.datum
      }
      if (result.datum.bis.value < messung.datum.value) {
        result.datum.bis = messung.datum
      }
    } else {
      result.datum = {
        von: messung.datum,
        bis: messung.datum
      }
    }
    // temperatur von bis
    if (result.temperatur) {
      if (result.temperatur.min.temperatur > messung.temperatur) {
        result.temperatur.min = messung
      }
      if (result.temperatur.max.temperatur < messung.temperatur) {
        result.temperatur.max = messung
      }
    } else {
      result.temperatur = {
        max: messung,
        min: messung
      }
    }
    // luftfeuchtigkeit von bis
    if (result.luftfeuchtigkeit) {
      if (result.luftfeuchtigkeit.min.luftfeuchtigkeit > messung.luftfeuchtigkeit) {
        result.luftfeuchtigkeit.min = messung
      }
      if (result.luftfeuchtigkeit.max.luftfeuchtigkeit < messung.luftfeuchtigkeit) {
        result.luftfeuchtigkeit.max = messung
      }
    } else {
      result.luftfeuchtigkeit = {
        min: messung,
        max: messung
      }
    }
  }
  // ermittle lueftungen
  messungen.sort(function (m1, m2) {
    return m1.datum.value < m2.datum.value ? -1 : 1
  })
  var i = 0
  var lueftungen = {messungen: []}
  var messungZeiger = messungen[0]
  var lueftungAbgeschlossen = true
  while(i++ < messungen.length) {
    var currentMessung = messungen[i]
    if (!currentMessung) continue
    if (lueftungAbgeschlossen && isStartOfLueftung(currentMessung, messungZeiger)) {
      lueftungen.messungen.push(currentMessung)
      lueftungAbgeschlossen = false
    } else if (!isStartOfLueftung(currentMessung, messungZeiger)) {
      lueftungAbgeschlossen = true
    }
    messungZeiger = currentMessung
  }
  result.tageBetrachtet = (result.datum.bis.value - result.datum.von.value) / (1000 * 60 * 60 * 24)
  lueftungen.avgProTag = lueftungen.messungen.length / result.tageBetrachtet
  // ergebnis aufbereiten
  // ø
  result.temperatur.avg = temperaturen.reduce(function (a, b) { return a + b; }) / temperaturen.length
  result.luftfeuchtigkeit.avg = luftfeuchtigkeiten.reduce(function (a, b) { return a + b; }) / luftfeuchtigkeiten.length
  result.messungen = messungen
  result.lueftungen = lueftungen
  return result;
}

var splitMessungenPerWeeks = function(messungen) {
  var splittetMessungen = {};
  messungen.forEach(function(messung) {
    var weekid = 'id' + moment(messung.datum.value).format('YYYYww');
    if(!splittetMessungen[weekid]) splittetMessungen[weekid] = [];
    messung.weekid = weekid;
    splittetMessungen[weekid].push(messung);
  });
  var results = [];
  Object.getOwnPropertyNames(splittetMessungen).forEach(function(weekid) {
    results.push(splittetMessungen[weekid]);
  });
  results.sort(function (r1, r2) {
    return r1.weekid < r2.weekid ? 1 : -1
  })
  return results;
}

fs.readFile(TXTFILE, 'utf8', auswertung)
