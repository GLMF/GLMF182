//TODO  :
// - renommer réseau en cpu dans tous les fichiers


/***********************************************/
/*  Inclusion des librairies                   */
/***********************************************/

var blessed = require('blessed')
var contrib = require('blessed-contrib')
var os = require('os-utils')
var njds = require('nodejs-disks')
var http = require('http')
var request = require('request')

var screen = blessed.screen()



/***********************************************/
/*  Création de la grille                      */
/***********************************************/

/**** Les grilles dans les grilles ****/

// Grille mère
// On définit une grille mère qui va diviser notre dashboard en 2 colonnes
var grid = new contrib.grid({rows: 1, cols: 2})

// Grille de la partie gauche
// On définie une seconde grille qui contient 2 lignes et 2 colonnes
// Elle sera utilisée pour la partie gauche de l'écran
var grid_left = new contrib.grid({rows: 2, cols: 2})

// Grille de la partie droite
// On définie une troisième grille qui ne contient qu'un élément. 
// Nous aviserons plus tard de son contenu
// Elle sera utilisée pour la partie droite de l'écran
var grid_right = new contrib.grid({rows: 1, cols: 1})

/**** On associe chaque élément de chaque sous grille à un type de composant ****/

// CPU, RAM
// On va définir une grille de 2 lignes et 1 colonne pour chaque valeur
// Chaque élément contiendra un widget de type jauge
var grid_cpu_ram = new contrib.grid({rows: 2, cols: 1})

grid_cpu_ram.set(0, 0, 
         contrib.gauge,
         {label: 'CPU'})
grid_cpu_ram.set(1, 0, 
         contrib.gauge,
         {label: 'RAM'})

// on imbrique la grille dans la grille parente
grid_left.set(0, 0, 
         grid_cpu_ram)

// Disques 
grid_left.set(0, 1, 
         contrib.table,
         {content: 'Disques '})

// Température
grid_left.set(1, 0, 
         contrib.line,
         {
           style:
           { line: "yellow",
             text: "green",
             baseline: "blue"
           },
           label: 'Température'
         })

// n/a
grid_left.set(1, 1, 
         blessed.box,
         {content: 'n/a'})

// n/a
grid_right.set(0, 0, 
         blessed.box,
         {content: 'n/a'})

/**** On inclue les grilles filles dans la grille mère ****/
grid.set(0, 0, grid_left)
grid.set(0, 1, grid_right)

// et on lie la grille mère à l'écran
grid.applyLayout(screen)


/***********************************************/
/*  CPU, RAM                                   */
/***********************************************/


// on créée une variable qui correspond à la jauge du cpu
var cpu_widget = grid_cpu_ram.get(0, 0)

// on créée une fonction qui va valoriser la jauge du cpu
function setCpu() {
    os.cpuUsage(function(v){
        cpu_widget.setPercent(Math.floor(v * 100))
    });
}
// on appelle la fonction une première fois puis toutes les secondes
setCpu()
setInterval(setCpu, 1000)

// on créée une variable qui correspond à la jauge de ram
var ram_widget = grid_cpu_ram.get(1, 0)

// on créée une fonction qui va valoriser la jauge de ram
function setRam() {
    ram_widget.setPercent(100 - Math.floor(os.freememPercentage() * 100))
}
// on appelle la fonction une première fois puis toutes les secondes
setRam()
setInterval(setRam, 1000)


/***********************************************/
/*  Disques                                    */
/***********************************************/

// on créée une variable qui correspond à la table 
var disk_widget = grid_left.get(0, 1)

// on créée une fonction qui va générer la table
function setDisks() {
    var disks_headers = ['Path', '% used']
    var disks_data = []
    disk_widget.setData( { headers: disks_headers,
                           data: disks_data})
    
    njds.drives(
        function (err, drives) {
            njds.drivesDetail(
                drives,
                function (err, data) {
                    for(var i = 0; i<data.length; i++)
                    {
                        // TODO : filtrer ce qui commance par /run
                        if ((data[i].mountpoint.indexOf("/run") > 0) || (data[i].mountpoint.indexOf("/run") == -1)) {
                            disks_data.push([data[i].mountpoint, 100 - data[i].freePer]);
                            disk_widget.setData( { headers: disks_headers,
                                                   data: disks_data});
                        }
                    }
                }
            );
        }
     )
}
// on appelle la fonction une première fois puis toutes les 10 secondes
setDisks()
setInterval(setDisks, 10000) 


/***********************************************/
/*  Courbe de températures                     */
/***********************************************/

var temperature_widget = grid_left.get(1, 0)
var temperatureData = {
   x: [],
   y: []
}
temperature_widget.setData(temperatureData.x, temperatureData.y)

function callDomogik() {
    var today = new Date()
    var to = (today.getTime()/1000).toFixed()
    var from = (today.setDate(today.getDate() - 1)/1000).toFixed()
    var url = 'http://192.168.1.50:50001/sensorhistory/id/96/from/' + from + '/to/' + to + '/interval/hour/selector/avg'
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            json_data = JSON.parse(body)
            var val_x = []
            var val_y = []
            for (idx in json_data['values']) {
                val_x.push(String(json_data['values'][idx][4]))
                val_y.push(json_data['values'][idx][5])
            }
            // update the chart
            temperature_widget.setData(val_x, val_y)
         }
    })
}
callDomogik()
setInterval(callDomogik, 2000)


/***********************************************/
/*  Préparation de l'affichage                 */
/***********************************************/

// On raraichit régulièrement
interval = 1
setInterval(function() {
    screen.render()
}, interval * 1000)

// On active des touches pour quitter proprement
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
  return process.exit(0);
});

// Premier affichage
screen.render()
