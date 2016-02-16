var fs = require('fs')

function usageAndExit() {
  console.info('node auswertung.js directory');
  process.exit(1);
}

if(process.argv.length != 3) usageAndExit();

var BASEDIR = process.argv[2] + '/';

var result = {
  datum: false,
  temperatur: false,
  luftfeuchtigkeit: false
}

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

var ausgabe = function (result) {
  var handlebars = require('handlebars')
  fs.readFile('auswertung.tpl', 'utf8', function (err, source) {
    var template = handlebars.compile(source)
    console.info(template(result))
  })
}

var isStartOfLueftung = function (currentMessung, messungZeiger, prozentUnterschied) {
  prozentUnterschied = prozentUnterschied || 2
  return currentMessung.luftfeuchtigkeit + prozentUnterschied < messungZeiger.luftfeuchtigkeit
}

var auswertung = function (err, data) {
  var datalines = data.split('\r\n')
  var i = datalines.length
  var temperaturen = []
  var luftfeuchtigkeiten = []
  var messungen = []
  while(i--) {
    var messung = createMessung(datalines[i])
    if (!messung.id) {
      continue
    }
    // array sammeln
    messungen.push(messung)
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
  ausgabe(result)
}

fs.readdir(BASEDIR, function (err, filenames) {
  if (err) throw err
  var i = 0
  while(i++ < filenames.length) {
    var filename = filenames[i];
    if (filename && filename.match(/^.+\.txt$/)) {
      fs.readFile(BASEDIR + filename, 'utf8', auswertung)
    }
  }
})
