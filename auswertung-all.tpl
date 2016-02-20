
AUSWERTUNGEN
============

{{tageBetrachtet}} Tage betrachtet von {{datum.von.day}} bis {{datum.bis.day}} ({{messungen.length}} Messungen)


Temperaturen
------------

Maximum  : {{temperatur.max.temperatur}} °C
Gemessen : {{temperatur.max.datum.day}} {{temperatur.max.datum.time}}

Minimum  : {{temperatur.min.temperatur}} °C
Gemessen : {{temperatur.min.datum.day}} {{temperatur.min.datum.time}}

ø        : {{temperatur.avg}} °C


Luftfeuchtigkeit
----------------

Maximum  : {{luftfeuchtigkeit.max.luftfeuchtigkeit}} %RH
Gemessen : {{luftfeuchtigkeit.max.datum.day}} {{luftfeuchtigkeit.max.datum.time}}

Minimum  : {{luftfeuchtigkeit.min.luftfeuchtigkeit}} %RH
Gemessen : {{luftfeuchtigkeit.min.datum.day}} {{luftfeuchtigkeit.min.datum.time}}

ø        : {{luftfeuchtigkeit.avg}} %RH

Lüftungen
---------

Anzahl    : {{lueftungen.messungen.length}}
ø pro Tag : {{lueftungen.avgProTag}}

{{#lueftungen.messungen}}
  {{datum.day}} {{datum.time}} {{luftfeuchtigkeit}} %RH
{{/lueftungen.messungen}}
