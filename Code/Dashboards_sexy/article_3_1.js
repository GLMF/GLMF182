/***********************************************/
/*  Inclusion des librairies                   */
/***********************************************/

var blessed = require('blessed')
var contrib = require('blessed-contrib')
var os = require('os-utils')
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
         blessed.box,
         {content: 'Disques'})

// Température
grid_left.set(1, 0, 
         blessed.box,
         {content: 'Température'})

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
